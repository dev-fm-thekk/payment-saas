import Razorpay from 'razorpay';
import { BaseAdapter } from './base';
import { ProviderName, ErrorCode } from '../types/enums';
import { PaymentRequest, RefundRequest, AccountRequest, TransactionFilters } from '../types/requests';
import { PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from '../types/responses';
import { PaymentError } from '../errors';
import { Plans } from 'razorpay/dist/types/plans';

export class RazorpayAdapter extends BaseAdapter {
  private client: Razorpay;

  constructor(credentials: any) {
    super(credentials);
    this.client = new Razorpay({
      key_id: credentials.apiKey,
      key_secret: credentials.apiSecret,
    });
  }

  async pay(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const order = await this.client.orders.create({
        amount: request.amount,
        currency: request.currency,
        receipt: request.receipt,
        notes: request.metadata,
      });
      return this.normaliser.normalisePayment(order, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse> {
    try {
      const payment = await this.client.payments.capture(paymentId, amount, currency);
      return this.normaliser.normalisePayment(payment, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.client.payments.refund(request.transactionId, {
        amount: request.amount,
        notes: request.metadata,
      });
      return this.normaliser.normaliseRefund(refund, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async getTransaction(id: string): Promise<TransactionResponse> {
    try {
      const payment = await this.client.payments.fetch(id);
      return this.normaliser.normaliseTransaction(payment, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createAccount(request: AccountRequest): Promise<AccountResponse> {
    try {
      // Razorpay Route account creation (simplification)
      const account = await (this.client as any).accounts.create({
        email: request.email,
        profile: {
          name: request.businessName,
        },
      });
      return this.normaliser.normaliseAccount(account, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createPlan(request: Plans.RazorpayPlanCreateRequestBody): Promise<any> {
    try {
      const plan = await this.client.plans.create(request);
      return plan;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]> {
    try {
      const payments = await this.client.payments.all({
        from: filters.from ? Math.floor(filters.from.getTime() / 1000) : undefined,
        to: filters.to ? Math.floor(filters.to.getTime() / 1000) : undefined,
        count: filters.limit,
      });
      return payments.items.map((p: any) => this.normaliser.normaliseTransaction(p, ProviderName.RAZORPAY));
    } catch (error) {
      throw this.mapError(error);
    }
  }

  protected mapError(error: any): PaymentError {
    const message = error?.error?.description || error?.message || 'Razorpay error';
    const providerCode = error?.error?.code || error?.code;

    let code = ErrorCode.PROVIDER_ERROR;
    let retryable = true;

    if (providerCode === 'BAD_REQUEST_ERROR') {
      code = ErrorCode.INVALID_REQUEST;
      retryable = false;
    } else if (providerCode === 'AUTHENTICATION_ERROR') {
      code = ErrorCode.AUTHENTICATION_ERROR;
      retryable = false;
    }

    return new PaymentError(
      code,
      message,
      ProviderName.RAZORPAY,
      providerCode,
      retryable
    );
  }
}
