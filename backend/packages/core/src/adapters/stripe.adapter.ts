import Stripe from 'stripe';
import { BaseAdapter } from './base';
import { ProviderName, ErrorCode } from '../types/enums';
import type {
  OrderRequest,
  PaymentRequest,
  RefundRequest,
  AccountRequest,
  TransactionFilters,
  Webhook,
  WebhookVerificationRequest,
  UpdateWebhookRequest,
  PaymentLinkRequest,
} from '../types/requests';
import type {
  OrderResponse,
  PaymentResponse,
  RefundResponse,
  TransactionResponse,
  AccountResponse,
  WebhookResponse,
  PaymentLinkResponse,
} from '../types/responses';
import { PaymentError } from '../errors';

export class StripeAdapter extends BaseAdapter {
  private client: Stripe;

  constructor(credentials: any) {
    super(credentials);
    this.client = new Stripe(credentials.apiKey, {
      apiVersion: '2025-01-27' as any,
    });
  }

  // ─── Payment methods ────────────────────────────────────────────────────────

  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.create({
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: request.metadata,
        capture_method: 'manual',
      });
      return this.normaliser.normaliseOrder(paymentIntent, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
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

  async capturePayment(paymentId: string, amount: number, _currency: string): Promise<PaymentResponse> {
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
      // Stripe uses Prices/Products for plans.
      const price = await this.client.prices.create({
        unit_amount: request.item.amount,
        currency: request.item.currency.toLowerCase(),
        recurring: { interval: request.period === 'daily' ? 'day' : 'month' },
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

  // ─── Payment links ────────────────────────────────────────────────────────

  /**
   * Creates a Stripe Payment Link.
   * Each item in the request must either supply a `priceId` (existing Stripe Price)
   * or a `price` (unit amount in cents), which will create an inline price object.
   *
   * Stripe docs: https://stripe.com/docs/api/payment_links/create
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      // Build the line_items array Stripe expects.
      // Stripe requires each item to reference a Price ID.
      // If the caller only provides a unit amount, we create an ad-hoc Price first.
      const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] = await Promise.all(
        request.item.map(async (item) => {
          if (item.priceId) {
            // Re-use an existing Stripe Price
            return { price: item.priceId, quantity: item.quantity };
          }

          // Create a one-off inline price for this item
          const price = await this.client.prices.create({
            unit_amount: item.price ?? 0,
            currency: request.currency.toLowerCase(),
            product_data: { name: 'Item' },
          });
          return { price: price.id, quantity: item.quantity };
        }),
      );

      const raw = await this.client.paymentLinks.create({
        line_items: lineItems,
        after_completion: request.callback_url
          ? {
              type: 'redirect',
              redirect: { url: request.callback_url },
            }
          : { type: 'hosted_confirmation' },
        metadata: request.metadata,
      });

      return this.normaliser.normalisePaymentLink(raw, ProviderName.STRIPE);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // ─── Webhook management ──────────────────────────────────────────────────────

  /**
   * Registers a new webhook endpoint with Stripe.
   * Stripe calls these "webhook endpoints" (`stripe.webhookEndpoints`).
   */
  async createWebHook(request: Webhook): Promise<WebhookResponse> {
    try {
      const endpoint = await this.client.webhookEndpoints.create({
        url: request.url,
        enabled_events: request.events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
        ...(request.secret ? { secret: request.secret } : {}),
      });
      return this.normaliseWebhook(endpoint);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Retrieves a specific webhook endpoint by ID.
   * `accountId` is ignored for Stripe (not applicable at endpoint level).
   */
  async listWebhook(webhookId: string, _accountId: string): Promise<WebhookResponse> {
    try {
      const endpoint = await this.client.webhookEndpoints.retrieve(webhookId);
      return this.normaliseWebhook(endpoint);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Updates an existing Stripe webhook endpoint.
   */
  async updateWebhook(request: UpdateWebhookRequest): Promise<WebhookResponse> {
    try {
      const params: Stripe.WebhookEndpointUpdateParams = {};
      if (request.url) params.url = request.url;
      if (request.events) {
        params.enabled_events = request.events as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
      }

      const endpoint = await this.client.webhookEndpoints.update(request.webhookId, params);
      return this.normaliseWebhook(endpoint);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Permanently deletes a Stripe webhook endpoint.
   */
  async deleteWebhook(webhookId: string, _accountId?: string): Promise<{ deleted: boolean }> {
    try {
      const deleted = await this.client.webhookEndpoints.del(webhookId);
      return { deleted: deleted.deleted };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Verifies the signature Stripe attaches to every webhook event.
   * Uses `stripe.webhooks.constructEvent` which validates the
   * `Stripe-Signature` header using the endpoint's signing secret.
   *
   * @param request.rawBody   Raw request body (Buffer from express.raw() or string)
   * @param request.signature Value of the `Stripe-Signature` header
   * @param request.secret    Webhook signing secret (whsec_…) from the Stripe dashboard
   */
  verifyWebhookSignature(request: WebhookVerificationRequest): boolean {
    try {
      this.client.webhooks.constructEvent(
        request.rawBody as string | Buffer,
        request.signature,
        request.secret,
      );
      return true;
    } catch {
      return false;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Maps a raw Stripe WebhookEndpoint object to a normalised WebhookResponse. */
  private normaliseWebhook(raw: Stripe.WebhookEndpoint): WebhookResponse {
    return {
      id: raw.id,
      url: raw.url,
      events: raw.enabled_events as string[],
      active: raw.status === 'enabled',
      provider: ProviderName.STRIPE,
      createdAt: new Date(raw.created * 1000),
      updatedAt: new Date(raw.created * 1000),
    };
  }
  
  protected mapError(error: any): PaymentError {
    const stripeError = error as Stripe.errors.StripeError;
    let code = ErrorCode.PROVIDER_ERROR;
    let retryable = true;

    if (stripeError?.type === 'StripeAuthenticationError') {
      code = ErrorCode.AUTHENTICATION_ERROR;
      retryable = false;
    } else if (stripeError?.type === 'StripeInvalidRequestError') {
      code = ErrorCode.INVALID_REQUEST;
      retryable = false;
    } else if (stripeError?.type === 'StripeRateLimitError') {
      code = ErrorCode.RATE_LIMIT;
    } else if (stripeError?.type === 'StripeConnectionError') {
      code = ErrorCode.NETWORK_ERROR;
    }

    return new PaymentError(
      code,
      stripeError?.message || 'Stripe error',
      ProviderName.STRIPE,
      stripeError?.code,
      retryable,
    );
  }
}
