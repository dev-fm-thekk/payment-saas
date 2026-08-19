import Stripe from 'stripe';
import { BasePaymentProvider, PaymentError } from '../base';
import { ErrorCode, ProviderName } from '../types';
import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  CreateWebhookRequest,
  CreateWebhookResponse,
  UpdateWebhookRequest,
  WebhookVerificationRequest,
} from '../types';

export class StripeAdapter extends BasePaymentProvider {
  private client: Stripe;

  constructor(credentials: { apiKey: string }) {
    super(credentials);
    this.client = new Stripe(credentials.apiKey, {
      apiVersion: '2025-01-27' as any,
    });
  }

  // ─── Payment links ────────────────────────────────────────────────────────

  /**
   * Creates a Stripe Payment Link.
   * Each item in the request must either supply a `priceId` (existing Stripe Price)
   * or a `price` (unit amount in cents), which will create an inline price object.
   *
   * Stripe docs: https://stripe.com/docs/api/payment_links/create
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse> {
    try {
      // Build the line_items array Stripe expects.
      // Stripe requires each item to reference a Price ID.
      // If the caller only provides a unit amount, we create an ad-hoc Price first.
      const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] =
        await Promise.all(
          (request.item || []).map(async (item) => {
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

      return this.normalisePaymentLink(raw);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // ─── Webhook management ───────────────────────────────────────────────────

  /**
   * Registers a new webhook endpoint with Stripe.
   * Stripe calls these "webhook endpoints" (`stripe.webhookEndpoints`).
   */
  async createWebhook(
    request: CreateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    try {
      const endpoint = await this.client.webhookEndpoints.create({
        url: request.url,
        enabled_events:
          request.events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
        ...(request.secret ? { secret: request.secret } : {}),
      });
      return this.normaliseWebhook(endpoint);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Retrieves a specific webhook endpoint by ID.
   * `accountId` is not applicable for Stripe at the endpoint level.
   */
  async fetchWebhook(
    webhookId: string,
    _accountId?: string,
  ): Promise<CreateWebhookResponse> {
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
  async updateWebhook(
    request: UpdateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    try {
      const params: Stripe.WebhookEndpointUpdateParams = {};
      if (request.url) params.url = request.url;
      if (request.events) {
        params.enabled_events =
          request.events as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
      }

      const endpoint = await this.client.webhookEndpoints.update(
        request.webhookId,
        params,
      );
      return this.normaliseWebhook(endpoint);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Permanently deletes a Stripe webhook endpoint.
   */
  async deleteWebhook(
    webhookId: string,
    _accountId?: string,
  ): Promise<{ deleted: boolean }> {
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

  private normalisePaymentLink(raw: Stripe.PaymentLink): CreatePaymentLinkResponse {
    return {
      id: raw.id,
      currency: raw.currency?.toUpperCase(),
      // Stripe exposes a boolean `active` field directly on the PaymentLink object
      status: raw.active === true,
      callback_url: (raw.after_completion as any)?.redirect?.url ?? '',
      upi_link: false,
      url: raw.url,
      amount: (raw as any).amount_total ?? 0,
      amount_paid: undefined,
      created_at: (raw as any).created || 0,
      items: Array.isArray((raw as any).line_items?.data)
        ? (raw as any).line_items.data.map((li: any) => ({
            quantity: li.quantity ?? 1,
            priceId: li.price?.id,
            price: li.price?.unit_amount,
          }))
        : undefined,
      provider: ProviderName.STRIPE,
    };
  }

  /** Maps a raw Stripe WebhookEndpoint object to a normalised CreateWebhookResponse. */
  private normaliseWebhook(raw: Stripe.WebhookEndpoint): CreateWebhookResponse {
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

  protected mapError(error: unknown): PaymentError {
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
