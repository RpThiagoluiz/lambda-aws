import { DynamoDB } from 'aws-sdk';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerDataSourceDTO } from '../../domain/dtos/customer-data-source.dto';
import { DatabaseConnectionError } from '../../domain/errors/customer.errors';

export class DynamoDbCustomerRepository implements ICustomerRepository {
  private readonly dynamodb: DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.tableName = process.env['DYNAMODB_TABLE'] || 'customers-dev';
  }

  public async findByCpf(cpf: string): Promise<Customer | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          cpf: cpf,
        },
      };

      console.log('DynamoDB Query:', JSON.stringify(params, null, 2));

      const result = await this.dynamodb.get(params).promise();

      if (!result.Item) {
        console.log(`Customer with CPF ${cpf} not found in DynamoDB`);
        return null;
      }

      console.log('DynamoDB Result:', JSON.stringify(result.Item, null, 2));

      const customerData: CustomerDataSourceDTO = {
        id: result.Item['id'],
        cpf: result.Item['cpf'],
        name: result.Item['name'],
        email: result.Item['email'],
        createdAt: result.Item['createdAt'],
        updatedAt: result.Item['updatedAt'],
      };

      return Customer.fromDataSource(customerData);
    } catch (error) {
      console.error('Error querying DynamoDB:', error);
      throw new DatabaseConnectionError(
        error instanceof Error ? error.message : 'Unknown database error'
      );
    }
  }
}
