import { PaymentRequest, RefundRequest, AccountRequest, TransactionFilters } from './types/requests';
import { PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from './types/responses';

export interface IPaymentProvider {
  pay(request: PaymentRequest): Promise<PaymentResponse>;
  capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  getTransaction(id: string): Promise<TransactionResponse>;
  createAccount(request: AccountRequest): Promise<AccountResponse>;
  createPlan(request: any): Promise<any>;
  listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]>;
}
