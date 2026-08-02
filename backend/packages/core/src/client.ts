import type { ClientConfig } from './types/config';
import type { IPaymentProvider } from './provider';
import { ProviderFactory } from './factory';
import type { OrderRequest, PaymentRequest, RefundRequest, AccountRequest, TransactionFilters, PaymentLinkRequest } from './types/requests';
import type { OrderResponse, PaymentResponse, RefundResponse, TransactionResponse, AccountResponse, PaymentLinkResponse } from './types/responses';

/**
 * High-level client that wraps a specific payment provider adapter.
 * Instantiate with a `ClientConfig` selecting the provider and its credentials.
 */
export class PaymentClient {
  private provider: IPaymentProvider;

  constructor(config: ClientConfig) {
    this.provider = ProviderFactory.create(config);
  }

  /**
   * Creates a provider-side order (Razorpay order / Stripe PaymentIntent in manual capture mode).
   * Must be called before `pay()` in the two-step order→payment flow.
   */
  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    return this.provider.createOrder(request);
  }

  /**
   * Initiates a payment. For Razorpay this creates an order; for Stripe it creates
   * an auto-capture PaymentIntent.
   */
  async pay(request: PaymentRequest): Promise<PaymentResponse> {
    return this.provider.pay(request);
  }

  /**
   * Captures a previously authorized payment (e.g. Stripe manual-capture PaymentIntent).
   */
  async capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse> {
    return this.provider.capturePayment(paymentId, amount, currency);
  }

  /**
   * Issues a full or partial refund for a completed transaction.
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    return this.provider.refund(request);
  }

  /**
   * Fetches a single transaction by its provider-side ID.
   */
  async getTransaction(id: string): Promise<TransactionResponse> {
    return this.provider.getTransaction(id);
  }

  /**
   * Creates a connected / sub-account on the provider (e.g. Stripe Connect, Razorpay Route).
   */
  async createAccount(request: AccountRequest): Promise<AccountResponse> {
    return this.provider.createAccount(request);
  }

  /**
   * Creates a subscription plan / recurring price (Razorpay Plans / Stripe Prices).
   */
  async createPlan(request: any): Promise<any> {
    return this.provider.createPlan(request);
  }

  /**
   * Lists transactions from the provider with optional date/status/pagination filters.
   */
  async listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]> {
    return this.provider.listTransactions(filters);
  }

  /**
   * Creates a shareable payment link (Razorpay Payment Link / Stripe Payment Link).
   * For Stripe, items without a `priceId` will have an ad-hoc Price created automatically.
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    return this.provider.createPaymentLink(request);
  }
}
