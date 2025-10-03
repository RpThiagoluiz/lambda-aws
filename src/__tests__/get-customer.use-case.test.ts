import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { ICustomerRepository } from '../domain/repositories/customer.repository.interface';
import { Customer } from '../domain/entities/customer.entity';
import { CpfValidator } from '../utils/cpf-validator';

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

describe('GetCustomerUseCase', () => {
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

  describe('execute', () => {
    it('should return customer data when customer exists', async () => {
      const cpf = '123.456.789-01';
      const cleanCpf = '12345678901';
      const mockCustomer = new Customer(
        '123',
        cleanCpf,
        'João Silva',
        'joao@email.com',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      mockCpfValidator.clean.mockReturnValue(cleanCpf);
      mockCpfValidator.isValid.mockReturnValue(true);
      mockRepository.findByCpf.mockResolvedValue(mockCustomer);

      const result = await useCase.execute(cpf);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '123',
        cpf: cleanCpf,
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(mockCpfValidator.clean).toHaveBeenCalledWith(cpf);
      expect(mockCpfValidator.isValid).toHaveBeenCalledWith(cleanCpf);
      expect(mockRepository.findByCpf).toHaveBeenCalledWith(cleanCpf);
    });

    it('should return error when customer not found', async () => {
      const cpf = '123.456.789-01';
      const cleanCpf = '12345678901';

      mockCpfValidator.clean.mockReturnValue(cleanCpf);
      mockCpfValidator.isValid.mockReturnValue(true);
      mockRepository.findByCpf.mockResolvedValue(null);

      const result = await useCase.execute(cpf);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'CUSTOMER_NOT_FOUND',
        message: `Customer with CPF ${cpf} not found`,
      });
    });

    it('should return error when CPF is invalid', async () => {
      const invalidCpf = '123';
      const cleanCpf = '123';

      mockCpfValidator.clean.mockReturnValue(cleanCpf);
      mockCpfValidator.isValid.mockReturnValue(false);

      const result = await useCase.execute(invalidCpf);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_CPF',
        message: `Invalid CPF format: ${invalidCpf}`,
      });
      expect(mockRepository.findByCpf).not.toHaveBeenCalled();
    });

    it('should return error when CPF has all same digits', async () => {
      const invalidCpf = '11111111111';

      mockCpfValidator.clean.mockReturnValue(invalidCpf);
      mockCpfValidator.isValid.mockReturnValue(false);

      const result = await useCase.execute(invalidCpf);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CPF');
    });

    it('should handle repository errors', async () => {
      const cpf = '123.456.789-01';
      const cleanCpf = '12345678901';

      mockCpfValidator.clean.mockReturnValue(cleanCpf);
      mockCpfValidator.isValid.mockReturnValue(true);
      mockRepository.findByCpf.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(cpf);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });
});
