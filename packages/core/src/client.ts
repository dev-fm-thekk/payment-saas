import { ClientConfig } from './types/config';
import { IPaymentProvider } from './provider';
import { ProviderFactory } from './factory';
import { PaymentRequest, RefundRequest, AccountRequest, TransactionFilters } from './types/requests';
import { PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from './types/responses';

export class PaymentClient {
  private provider: IPaymentProvider;

  constructor(config: ClientConfig) {
    this.provider = ProviderFactory.create(config);
  }

  async pay(request: PaymentRequest): Promise<PaymentResponse> {
    return this.provider.pay(request);
  }

  async capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse> {
    return this.provider.capturePayment(paymentId, amount, currency);
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    return this.provider.refund(request);
  }

  async getTransaction(id: string): Promise<TransactionResponse> {
    return this.provider.getTransaction(id);
  }

  async createAccount(request: AccountRequest): Promise<AccountResponse> {
    return this.provider.createAccount(request);
  }

  async createPlan(request: any): Promise<any> {
    return this.provider.createPlan(request);
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]> {
    return this.provider.listTransactions(filters);
  }
}
