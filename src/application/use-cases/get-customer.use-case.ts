import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { GetCustomerResponseDTO } from '../../domain/dtos/get-customer-response.dto';
import {
  CustomerNotFoundError,
  InvalidCpfError,
  DatabaseConnectionError,
} from '../../domain/errors/customer.errors';
import { CpfValidator } from '../../utils/cpf-validator';

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(cpf: string): Promise<GetCustomerResponseDTO> {
    try {
      const cleanCpf = CpfValidator.clean(cpf);

      if (!CpfValidator.isValid(cleanCpf)) {
        return {
          success: false,
          error: {
            code: 'INVALID_CPF',
            message: `Invalid CPF format: ${cpf}`,
          },
        };
      }

      const customer = await this.customerRepository.findByCpf(cleanCpf);

      if (!customer) {
        return {
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: `Customer with CPF ${cpf} not found`,
          },
        };
      }

      return {
        success: true,
        data: customer.toResponseData(),
      };
    } catch (error) {
      console.error('Error in GetCustomerUseCase:', error);

      if (error instanceof CustomerNotFoundError) {
        return {
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: (error as Error).message,
          },
        };
      }

      if (error instanceof InvalidCpfError) {
        return {
          success: false,
          error: {
            code: 'INVALID_CPF',
            message: (error as Error).message,
          },
        };
      }

      if (error instanceof DatabaseConnectionError) {
        return {
          success: false,
          error: {
            code: 'DATABASE_CONNECTION_ERROR',
            message: (error as Error).message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    }
  }
}
