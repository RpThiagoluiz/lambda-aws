import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { GetCustomerController } from './presentation/controllers/get-customer.controller';

const getCustomerController = new GetCustomerController();

/**
 * Lambda handler for getting customer by CPF
 *
 * @param event - API Gateway event
 * @param context - Lambda context
 * @returns Promise<APIGatewayProxyResult>
 */
export const getCustomer = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return getCustomerController.handle(event, context);
};
