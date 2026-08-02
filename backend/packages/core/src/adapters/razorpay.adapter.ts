import Razorpay from 'razorpay';
import crypto from 'crypto';
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
import type { Plans } from 'razorpay/dist/types/plans';
import type { Webhooks } from 'razorpay/dist/types/webhooks';
import { error } from 'console';

export class RazorpayAdapter extends BaseAdapter {
  private client: Razorpay;

  constructor(credentials: any) {
    super(credentials);
    this.client = new Razorpay({
      key_id: credentials.apiKey,
      key_secret: credentials.apiSecret,
    });
  }

  // ─── Payment methods ────────────────────────────────────────────────────────

  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    try {
      const order = await this.client.orders.create({
        amount: request.amount,
        currency: request.currency,
        receipt: request.receipt,
        notes: request.metadata,
      });
      return this.normaliser.normaliseOrder(order, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
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

  // ─── Payment links ────────────────────────────────────────────────────────

  /**
   * Creates a Razorpay Payment Link.
   * Razorpay Payment Links are shareable URLs that accept payment from customers.
   * Uses `razorpay.paymentLink.create` under the hood.
   *
   * Razorpay docs: https://razorpay.com/docs/api/payment-links/
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      // Razorpay expects amount in paise (smallest currency unit)
      const totalAmount = request.item.reduce((sum, i) => {
        return sum + (i.price ?? 0) * i.quantity;
      }, 0);

      const raw = await this.client.paymentLink.create({
        amount: totalAmount,
        currency: request.currency,
        description: request.description,
        callback_url: request.callback_url,
        callback_method: request.callback_method ?? 'get',
        upi_link: request.upi_link ?? false,
        notes: request.metadata,
        customer: request.customer!,
        notify: {
          email: false,
          sms: false,
          whatsapp: false
        }
      });

      return this.normaliser.normalisePaymentLink(raw, ProviderName.RAZORPAY);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // ─── Webhook management ──────────────────────────────────────────────────────

  /**
   * Registers a new webhook on the Razorpay account.
   * Razorpay requires `account_id` when creating webhooks via the Routes API.
   * For a standard merchant account the SDK creates the webhook at account level.
   */
  async createWebHook(request: Webhook): Promise<WebhookResponse> {
    try {
      const payload = {
        url: request.url,
        alert_email: request.alert_email,
        secret: request.secret,
        events: request.events.reduce((acc: Record<string, boolean>, e) => {
          acc[e] = true;
          return acc;
        }, {}),
      } as Webhooks.RazorpayWebhookCreateRequestBody;

      let raw: any;
      if (request.accountId) {
        raw = await this.client.webhooks.create(payload, request.accountId);
      } else {
        raw = await this.client.webhooks.create(payload);
      }

      return this.normaliseWebhook(raw);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Fetches a specific webhook by ID.
   */
  async listWebhook(webhookId: string, accountId: string): Promise<WebhookResponse> {
    try {
      const raw = await this.client.webhooks.fetch(webhookId, accountId);
      return this.normaliseWebhook(raw);
    } catch (err) {
      throw this.mapError(err);
    }
  }

  /**
   * Updates an existing webhook (URL, events, secret, alert_email).
   * Uses the Razorpay PATCH endpoint via the SDK's `edit` method.
   */
  async updateWebhook(request: UpdateWebhookRequest): Promise<WebhookResponse> {
    try {
      const payload: Record<string, any> = {};
      if (request.url) payload['url'] = request.url;
      if (request.secret) payload['secret'] = request.secret;
      if (request.alert_email) payload['alert_email'] = request.alert_email;
      if (request.events) {
        payload['events'] = request.events.reduce((acc: Record<string, boolean>, e) => {
          acc[e] = true;
          return acc;
        }, {});
      }

      let raw: any;
      if (request.accountId) {
        raw = await (this.client.webhooks as any).edit(payload, request.webhookId, request.accountId);
      } else {
        raw = await (this.client.webhooks as any).edit(payload, request.webhookId);
      }

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
  async deleteWebhook(webhookId: string, accountId?: string): Promise<{ deleted: boolean }> {
    try {
      if (typeof (this.client.webhooks as any).delete === 'function') {
        await (this.client.webhooks as any).delete(webhookId, accountId);
      } else {
        // Deactivate by setting all events to false
        const updatePayload = { active: false };
        if (accountId) {
          await (this.client.webhooks as any).edit(updatePayload, webhookId, accountId);
        } else {
          await (this.client.webhooks as any).edit(updatePayload, webhookId);
        }
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
      const body = typeof request.rawBody === 'string'
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

  /** Maps a raw Razorpay webhook object to a normalised WebhookResponse. */
  private normaliseWebhook(raw: any): WebhookResponse {
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
      retryable,
    );
  }
}
