import { IPaymentProvider } from '../provider';
import { ProviderCredentials } from '../types/config';
import { ResponseNormaliser } from '../normaliser';
import { PaymentRequest, RefundRequest, AccountRequest, TransactionFilters } from '../types/requests';
import { PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from '../types/responses';
import { PaymentError } from '../errors';

export abstract class BaseAdapter implements IPaymentProvider {
  protected normaliser: ResponseNormaliser;

  constructor(protected credentials: ProviderCredentials) {
    this.normaliser = new ResponseNormaliser();
  }

  abstract pay(request: PaymentRequest): Promise<PaymentResponse>;
  abstract capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse>;
  abstract refund(request: RefundRequest): Promise<RefundResponse>;
  abstract getTransaction(id: string): Promise<TransactionResponse>;
  abstract createAccount(request: AccountRequest): Promise<AccountResponse>;
  abstract createPlan(request: any): Promise<any>;
  abstract listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]>;

  protected abstract mapError(error: any): PaymentError;
}
