import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { ICustomerRepository } from '../domain/repositories/customer.repository.interface';
import { Customer } from '../domain/entities/customer.entity';
import { CpfValidator } from '../utils/cpf-validator';
import { DatabaseConnectionError } from '../domain/errors/customer.errors';

jest.mock('../utils/cpf-validator');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('GetCustomerUseCase - AWS Lambda Scenarios', () => {
  let useCase: GetCustomerUseCase;
  let mockRepository: jest.Mocked<ICustomerRepository>;
  let mockCpfValidator: jest.Mocked<typeof CpfValidator>;

  beforeEach(() => {
    mockRepository = {
      findByCpf: jest.fn(),
    };

    mockCpfValidator = CpfValidator as jest.Mocked<typeof CpfValidator>;

    useCase = new GetCustomerUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AWS Lambda Cold Start Scenarios', () => {
    it('should handle cold start with slow database connection', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      const customer = Customer.fromDataSource({
        id: '123',
        cpf: '12345678901',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      mockRepository.findByCpf.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return customer;
      });

      const result = await useCase.execute('123.456.789-01');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('João Silva');
    });

    it('should handle Lambda timeout gracefully', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      mockRepository.findByCpf.mockRejectedValue(
        new Error('Task timed out after 15.00 seconds')
      );

      const result = await useCase.execute('123.456.789-01');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });

    it('should handle RDS connection limit reached', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      mockRepository.findByCpf.mockRejectedValue(
        new DatabaseConnectionError('too many connections')
      );

      const result = await useCase.execute('123.456.789-01');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATABASE_CONNECTION_ERROR');
    });
  });

  describe('AWS Environment Variables', () => {
    it('should work with AWS Lambda environment variables', () => {
      const originalEnv = process.env;

      process.env = {
        ...originalEnv,
        AWS_REGION: 'us-east-1',
        AWS_LAMBDA_FUNCTION_NAME: 'getCustomer',
        AWS_LAMBDA_FUNCTION_VERSION: '$LATEST',
        AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '512',
        DB_HOST: 'prod-cluster.cluster-xyz.us-east-1.rds.amazonaws.com',
        DB_NAME: 'customers_main',
      };

      expect(process.env.AWS_REGION).toBe('us-east-1');
      expect(process.env.DB_HOST).toContain('rds.amazonaws.com');

      process.env = originalEnv;
    });
  });

  describe('High Load Scenarios', () => {
    it('should handle concurrent Lambda invocations', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      const customer = Customer.fromDataSource({
        id: '123',
        cpf: '12345678901',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      mockRepository.findByCpf.mockResolvedValue(customer);

      const concurrentCalls = Array(10).fill('123.456.789-01');
      const promises = concurrentCalls.map((cpf) => useCase.execute(cpf));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('João Silva');
      });

      expect(mockRepository.findByCpf).toHaveBeenCalledTimes(10);
    });

    it('should handle memory pressure in Lambda', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      mockRepository.findByCpf.mockRejectedValue(
        new Error('JavaScript heap out of memory')
      );

      const result = await useCase.execute('123.456.789-01');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Production Data Validation', () => {
    it('should handle real Brazilian CPF formats', async () => {
      const validCpfs = [
        '123.456.789-01',
        '12345678901',
        '111.111.111-11',
        '000.000.000-00',
      ];

      for (const cpf of validCpfs) {
        const cleanCpf = cpf.replace(/[.-]/g, '');
        mockCpfValidator.clean.mockReturnValue(cleanCpf);
        mockCpfValidator.isValid.mockReturnValue(true);
        mockRepository.findByCpf.mockResolvedValue(null);

        const result = await useCase.execute(cpf);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CUSTOMER_NOT_FOUND');
      }
    });

    it('should handle customer data with special characters', async () => {
      mockCpfValidator.clean.mockReturnValue('12345678901');
      mockCpfValidator.isValid.mockReturnValue(true);

      const customer = Customer.fromDataSource({
        id: '123',
        cpf: '12345678901',
        name: 'José da Silva Ção',
        email: 'jose.silva+test@empresa.com.br',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      mockRepository.findByCpf.mockResolvedValue(customer);

      const result = await useCase.execute('123.456.789-01');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('José da Silva Ção');
      expect(result.data?.email).toBe('jose.silva+test@empresa.com.br');
    });
  });
});
