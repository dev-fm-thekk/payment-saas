import { ErrorCode, ProviderName } from './types';
import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  CreateWebhookRequest,
  CreateWebhookResponse,
  UpdateWebhookRequest,
  WebhookVerificationRequest,
} from './types';

// ─── Error ───────────────────────────────────────────────────────────────────

export class PaymentError extends Error {
  constructor(
    public code: ErrorCode,
    override message: string,
    public provider: ProviderName,
    public providerErrorCode?: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ─── Abstract base ────────────────────────────────────────────────────────────

export abstract class BasePaymentProvider {
  constructor(protected credentials: { apiKey: string; apiSecret?: string }) {}

  // ─── Payment links ──────────────────────────────────────────────────────────
  abstract createPaymentLink(
    request: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse>;

  // ─── Webhook management ─────────────────────────────────────────────────────
  abstract createWebhook(
    request: CreateWebhookRequest,
  ): Promise<CreateWebhookResponse>;

  abstract fetchWebhook(
    webhookId: string,
    accountId?: string,
  ): Promise<CreateWebhookResponse>;

  abstract updateWebhook(
    request: UpdateWebhookRequest,
  ): Promise<CreateWebhookResponse>;

  abstract deleteWebhook(
    webhookId: string,
    accountId?: string,
  ): Promise<{ deleted: boolean }>;

  /** Verifies the authenticity of an incoming webhook payload from the provider. */
  abstract verifyWebhookSignature(request: WebhookVerificationRequest): boolean;

  protected abstract mapError(error: unknown): PaymentError;
}
