export class Customer {
  constructor(
    public readonly id: string,
    public readonly cpf: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public static fromDataSource(data: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }): Customer {
    return new Customer(
      data.id,
      data.cpf,
      data.name,
      data.email,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  public toResponseData(): {
    id: string;
    cpf: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      cpf: this.cpf,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
