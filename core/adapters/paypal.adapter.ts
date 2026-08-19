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

export class PaypalAdapter extends BasePaymentProvider {
  async createPaymentLink(
    _request: CreatePaymentLinkRequest,
  ): Promise<CreatePaymentLinkResponse> {
    throw new Error('PayPal adapter: createPaymentLink not yet implemented');
  }

  async createWebhook(
    _request: CreateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    throw new Error('PayPal adapter: createWebhook not yet implemented');
  }

  async fetchWebhook(
    _webhookId: string,
    _accountId?: string,
  ): Promise<CreateWebhookResponse> {
    throw new Error('PayPal adapter: fetchWebhook not yet implemented');
  }

  async updateWebhook(
    _request: UpdateWebhookRequest,
  ): Promise<CreateWebhookResponse> {
    throw new Error('PayPal adapter: updateWebhook not yet implemented');
  }

  async deleteWebhook(
    _webhookId: string,
    _accountId?: string,
  ): Promise<{ deleted: boolean }> {
    throw new Error('PayPal adapter: deleteWebhook not yet implemented');
  }

  verifyWebhookSignature(_request: WebhookVerificationRequest): boolean {
    throw new Error(
      'PayPal adapter: verifyWebhookSignature not yet implemented',
    );
  }

  protected mapError(error: unknown): PaymentError {
    const e = error as any;
    return new PaymentError(
      ErrorCode.PROVIDER_ERROR,
      e?.message || 'PayPal error',
      ProviderName.RAZORPAY, // placeholder until PayPal enum is added
    );
  }
}