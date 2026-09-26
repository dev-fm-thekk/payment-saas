import Razorpay from 'razorpay';
import crypto from 'crypto';
import type { Webhooks } from 'razorpay/dist/types/webhooks';
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

export class RazorpayAdapter extends BasePaymentProvider {
  private client: Razorpay;

  constructor(credentials: { apiKey: string; apiSecret: string }) {
    super(credentials);
    this.client = new Razorpay({
      key_id: credentials.apiKey,
      key_secret: credentials.apiSecret,
    });
  }

  // ─── Payment links ────────────────────────────────────────────────────────

  /**
   * Creates a Razorpay Payment Link.
   * Razorpay Payment Links are shareable URLs that accept payment from customers.
   * Uses `razorpay.paymentLink.create` under the hood.
   *
   * Razorpay docs: https://razorpay.com/docs/api/payment-links/
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse> {
    try {
      // Razorpay expects amount in paise (smallest currency unit)
      const totalAmount = request.amount;

      const raw = await this.client.paymentLink.create({
        amount: totalAmount,
        currency: request.currency,
        description: request.description,
        callback_url: request.callback_url,
        callback_method: request.callback_method ?? 'get',
        upi_link: request.upi_link ?? false,
        notes: request.metadata,
        ...(request.customer ? { customer: request.customer } : {}),
        notify: {
          email: false,
          sms: false,
          whatsapp: false,
        },
      } as any);

      return this.normalisePaymentLink(raw);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // ─── Webhook management ───────────────────────────────────────────────────

  /**
   * Registers a new webhook on the Razorpay account.
   * Razorpay requires `account_id` when creating webhooks via the Routes API.
   * For a standard merchant account the SDK creates the webhook at account level.
   */
  async createWebhook(
    request: CreateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    try {
      const payload = {
        url: request.url,
        alert_email: request.alert_email,
        secret: request.secret,
        events: request.events.reduce(
          (acc: Record<string, boolean>, e) => {
            acc[e] = true;
            return acc;
          },
          {},
        ),
      } as Webhooks.RazorpayWebhookCreateRequestBody;

      const raw = await this.client.webhooks.create(payload);
      return this.normaliseWebhook(raw);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Fetches a specific webhook by ID.
   */
  async fetchWebhook(
    webhookId: string,
  ): Promise<CreateWebhookResponse> {
    try {
      const raw = await this.client.webhooks.fetch(webhookId, '');
      return this.normaliseWebhook(raw);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Updates an existing webhook (URL, events, secret, alert_email).
   * Uses the Razorpay PATCH endpoint via the SDK's `edit` method.
   */
  async updateWebhook(
    request: UpdateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    try {
      const payload: Record<string, any> = {};
      if (request.url) payload['url'] = request.url;
      if (request.secret) payload['secret'] = request.secret;
      if (request.alert_email) payload['alert_email'] = request.alert_email;
      if (request.events) {
        payload['events'] = request.events.reduce(
          (acc: Record<string, boolean>, e) => {
            acc[e] = true;
            return acc;
          },
          {},
        );
      }

      const raw = await (this.client.webhooks as any).edit(
        payload,
        request.webhookId,
      );

      return this.normaliseWebhook(raw);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Deletes (deactivates) a webhook.
   * Razorpay does not expose a hard-delete via the public API, so we mark it inactive.
   * Falls back to a PATCH to deactivate if the SDK does not expose a delete method.
   */
  async deleteWebhook(
    webhookId: string,
  ): Promise<{ deleted: boolean }> {
    try {
      if (typeof (this.client.webhooks as any).delete === 'function') {
        await (this.client.webhooks as any).delete(webhookId);
      } else {
        const updatePayload = { active: false };
        await (this.client.webhooks as any).edit(updatePayload, webhookId);
      }
      return { deleted: true };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Verifies the HMAC-SHA256 signature Razorpay attaches to every webhook.
   * Header: `X-Razorpay-Signature`
   *
   * @param request.rawBody   Raw request body string (before JSON.parse)
   * @param request.signature Value of the `X-Razorpay-Signature` header
   * @param request.secret    Webhook secret configured during registration
   */
  verifyWebhookSignature(request: WebhookVerificationRequest): boolean {
    try {
      const body =
        typeof request.rawBody === 'string'
          ? request.rawBody
          : request.rawBody.toString('utf-8');

      const expectedSignature = crypto
        .createHmac('sha256', request.secret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(request.signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private normalisePaymentLink(raw: any): CreatePaymentLinkResponse {
    return {
      id: raw.id,
      currency: raw.currency,
      // Razorpay status is a string ('created', 'paid', 'expired', 'cancelled').
      // Map it to a boolean: true = link is still usable.
      status: raw.status === 'created',
      callback_url: raw.callback_url,
      callback_method: raw.callback_method,
      upi_link: raw.upi_link,
      url: raw.short_url,
      amount: raw.amount,
      amount_paid: raw.amount_paid,
      created_at: raw.created_at,
      items: Array.isArray(raw.line_items)
        ? raw.line_items.map((li: any) => ({
            quantity: li.quantity ?? 1,
            price: li.unit_amount ?? li.amount,
          }))
        : undefined,
      provider: ProviderName.RAZORPAY,
    };
  }

  /** Maps a raw Razorpay webhook object to a normalised CreateWebhookResponse. */
  private normaliseWebhook(raw: any): CreateWebhookResponse {
    const events = raw.events
      ? Object.keys(raw.events).filter((k) => raw.events[k] === true)
      : [];

    return {
      id: raw.id,
      url: raw.url,
      events,
      active: raw.active ?? true,
      alertEmail: raw.alert_email,
      provider: ProviderName.RAZORPAY,
      createdAt: raw.created_at ? new Date(raw.created_at * 1000) : new Date(),
      updatedAt: raw.updated_at ? new Date(raw.updated_at * 1000) : new Date(),
    };
  }

  protected mapError(error: unknown): PaymentError {
    const e = error as any;
    const message = e?.error?.description || e?.message || 'Razorpay error';
    const providerCode = e?.error?.code || e?.code;

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
      retryable,
    );
  }
}