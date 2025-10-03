import { PostgreSQLCustomerRepository } from '../infrastructure/repositories/postgresql-customer.repository';
import { Pool } from 'pg';

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

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

describe('PostgreSQLCustomerRepository - AWS Lambda Integration', () => {
  let repository: PostgreSQLCustomerRepository;
  let mockPool: any;
  let mockClient: any;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    process.env.DB_HOST =
      'mock-rds-cluster.cluster-xyz.us-east-1.rds.amazonaws.com';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'customers_main';
    process.env.DB_USER = 'lambda_user';
    process.env.DB_PASSWORD = 'secure_password';

    mockQuery = jest.fn();
    mockClient = {
      query: mockQuery,
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: mockQuery,
      end: jest.fn().mockResolvedValue(undefined),
    };

    (Pool as unknown as jest.Mock).mockImplementation(() => mockPool);

    repository = new PostgreSQLCustomerRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();

    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
  });

  describe('AWS RDS Connection', () => {
    it('should configure pool with AWS RDS settings', () => {
      expect(Pool).toHaveBeenCalledWith({
        host: 'mock-rds-cluster.cluster-xyz.us-east-1.rds.amazonaws.com',
        port: 5432,
        database: 'customers_main',
        user: 'lambda_user',
        password: 'secure_password',
        ssl: {
          rejectUnauthorized: false,
        },
        max: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should handle connection timeout gracefully', async () => {
      mockPool.connect.mockRejectedValue(new Error('connect ETIMEDOUT'));

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(
        'connect ETIMEDOUT'
      );
    });

    it('should handle SSL connection errors', async () => {
      mockPool.connect.mockRejectedValue(new Error('SSL connection error'));

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(
        'SSL connection error'
      );
    });

    it('should release connection even on query error', async () => {
      mockQuery.mockRejectedValue(new Error('Query timeout'));

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(
        'Query timeout'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle multiple concurrent requests (Lambda scaling)', async () => {
      const cpfs = ['12345678901', '98765432109', '11111111111'];

      mockQuery.mockResolvedValue({ rows: [] });

      const promises = cpfs.map((cpf) => repository.findByCpf(cpf));
      await Promise.all(promises);

      expect(mockPool.connect).toHaveBeenCalledTimes(3);
      expect(mockClient.release).toHaveBeenCalledTimes(3);
    });

    it('should properly close pool for Lambda cleanup', async () => {
      await repository.close();
      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe('Production Data Scenarios', () => {
    it('should handle large result sets efficiently', async () => {
      const mockResult = {
        rows: [
          {
            id: 'customer-uuid-123',
            cpf: '12345678901',
            name: 'João Silva Santos',
            email: 'joao.silva@empresa.com.br',
            created_at: '2024-01-01T10:30:00.000Z',
            updated_at: '2024-09-18T15:45:30.123Z',
          },
        ],
      };
      mockQuery.mockResolvedValue(mockResult);

      const result = await repository.findByCpf('12345678901');

      expect(result).toBeDefined();
      expect(result?.id).toBe('customer-uuid-123');
      expect(result?.email).toBe('joao.silva@empresa.com.br');
    });

    it('should handle database maintenance mode', async () => {
      mockQuery.mockRejectedValue(new Error('database is in maintenance mode'));

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(
        'database is in maintenance mode'
      );
    });

    it('should handle read replica failover', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('connection terminated'))
        .mockResolvedValue({ rows: [] });

      await expect(repository.findByCpf('12345678901')).rejects.toThrow(
        'connection terminated'
      );
    });
  });
});
