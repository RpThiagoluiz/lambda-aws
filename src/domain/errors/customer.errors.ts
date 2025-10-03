export class CustomerNotFoundError extends Error {
  constructor(cpf: string) {
    super(`Customer with CPF ${cpf} not found`);
    this.name = 'CustomerNotFoundError';
  }
}

export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}`);
    this.name = 'InvalidCpfError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(`Database connection error: ${message}`);
    this.name = 'DatabaseConnectionError';
  }
}
