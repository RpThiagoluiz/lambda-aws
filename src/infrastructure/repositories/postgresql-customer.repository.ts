import { Pool } from 'pg';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerDataSourceDTO } from '../../domain/dtos/customer-data-source.dto';
import { DatabaseConnectionError } from '../../domain/errors/customer.errors';

export class PostgreSQLCustomerRepository implements ICustomerRepository {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'customers_db',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
      ssl: {
        rejectUnauthorized: false,
      },
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('PostgreSQL Config:', {
      host: process.env['DB_HOST'],
      port: process.env['DB_PORT'],
      database: process.env['DB_NAME'],
      user: process.env['DB_USER'],
      hasPassword: !!process.env['DB_PASSWORD'],
    });
  }

  public async findByCpf(cpf: string): Promise<Customer | null> {
    const client = await this.pool.connect();

    try {
      console.log(`Searching for customer with CPF: ${cpf}`);

      const query =
        'SELECT id, cpf, name, email, created_at, updated_at FROM customers WHERE cpf = $1';
      const result = await client.query(query, [cpf]);

      if (result.rows.length === 0) {
        console.log(`Customer with CPF ${cpf} not found in PostgreSQL`);
        return null;
      }

      const row = result.rows[0];
      console.log('PostgreSQL Result:', JSON.stringify(row, null, 2));

      const customerData: CustomerDataSourceDTO = {
        id: row.id,
        cpf: row.cpf,
        name: row.name,
        email: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      return Customer.fromDataSource(customerData);
    } catch (error) {
      console.error('Error querying PostgreSQL:', error);
      throw new DatabaseConnectionError(
        error instanceof Error ? error.message : 'Unknown database error'
      );
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
