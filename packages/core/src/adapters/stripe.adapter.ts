import Stripe from 'stripe';
import { BaseAdapter } from './base';
import { ProviderName, ErrorCode } from '../types/enums';
import { PaymentRequest, RefundRequest, AccountRequest, TransactionFilters } from '../types/requests';
import { PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from '../types/responses';
import { PaymentError } from '../errors';

export class StripeAdapter extends BaseAdapter {
  private client: Stripe;

  constructor(credentials: any) {
    super(credentials);
    this.client = new Stripe(credentials.apiKey, {
        apiVersion: '2025-01-27' as any,
    });
  }

  async pay(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const session = await this.client.paymentIntents.create({
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: request.metadata,
      });
      return this.normaliser.normalisePayment(session, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.capture(paymentId, {
        amount_to_capture: amount,
      });
      return this.normaliser.normalisePayment(paymentIntent, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.client.refunds.create({
        payment_intent: request.transactionId,
        amount: request.amount,
        metadata: request.metadata,
      });
      return this.normaliser.normaliseRefund(refund, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async getTransaction(id: string): Promise<TransactionResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.retrieve(id);
      return this.normaliser.normaliseTransaction(paymentIntent, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createAccount(request: AccountRequest): Promise<AccountResponse> {
    try {
      const account = await this.client.accounts.create({
        type: 'standard',
        email: request.email,
        country: request.country,
      });
      return this.normaliser.normaliseAccount(account, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createPlan(request: any): Promise<any> {
    try {
      // Stripe uses Prices/Products for plans. This is a placeholder.
      const price = await this.client.prices.create({
        unit_amount: request.item.amount,
        currency: request.item.currency.toLowerCase(),
        recurring: { interval: request.period === 'daily' ? 'day' : 'month' }, // Simplification
        product_data: { name: request.item.name },
      });
      return price;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]> {
    try {
      const paymentIntents = await this.client.paymentIntents.list({
        limit: filters.limit,
        starting_after: filters.cursor,
      });
      return paymentIntents.data.map((p: any) => this.normaliser.normaliseTransaction(p, ProviderName.STRIPE));
    } catch (error) {
      throw this.mapError(error);
    }
  }

  protected mapError(error: any): PaymentError {
    return new PaymentError(
      ErrorCode.PROVIDER_ERROR,
      error?.message || 'Stripe error',
      ProviderName.STRIPE,
      error?.code,
      true
    );
  }
}
