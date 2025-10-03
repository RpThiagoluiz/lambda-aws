import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  findByCpf(cpf: string): Promise<Customer | null>;
}
