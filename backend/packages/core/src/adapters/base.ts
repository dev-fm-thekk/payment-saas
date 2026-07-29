import type { IPaymentProvider } from '../provider';
import type { ProviderCredentials } from '../types/config';
import { ResponseNormaliser } from '../normaliser';
import type { OrderRequest, PaymentRequest, RefundRequest, AccountRequest, TransactionFilters, Webhook, WebhookVerificationRequest, UpdateWebhookRequest } from '../types/requests';
import type { OrderResponse, PaymentResponse, RefundResponse, TransactionResponse, AccountResponse, WebhookResponse } from '../types/responses';
import { PaymentError } from '../errors';

export abstract class BaseAdapter implements IPaymentProvider {
  protected normaliser: ResponseNormaliser;

  constructor(protected credentials: ProviderCredentials) {
    this.normaliser = new ResponseNormaliser();
  }

  abstract createOrder(request: OrderRequest): Promise<OrderResponse>;
  abstract pay(request: PaymentRequest): Promise<PaymentResponse>;
  abstract capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse>;
  abstract refund(request: RefundRequest): Promise<RefundResponse>;
  abstract getTransaction(id: string): Promise<TransactionResponse>;
  abstract createAccount(request: AccountRequest): Promise<AccountResponse>;
  abstract createPlan(request: any): Promise<any>;
  abstract listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]>;

  // ─── Webhook management ───────────────────────────────────────────────────
  abstract createWebHook(request: Webhook): Promise<WebhookResponse>;
  abstract listWebhook(webhookId: string, accountId: string): Promise<WebhookResponse>;
  abstract updateWebhook(request: UpdateWebhookRequest): Promise<WebhookResponse>;
  abstract deleteWebhook(webhookId: string, accountId?: string): Promise<{ deleted: boolean }>;
  /** Verifies the authenticity of an incoming webhook from the provider. */
  abstract verifyWebhookSignature(request: WebhookVerificationRequest): boolean;

  protected abstract mapError(error: any): PaymentError;
}
