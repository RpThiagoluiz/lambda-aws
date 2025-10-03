export interface GetCustomerResponseDTO {
  success: boolean;
  data?: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
