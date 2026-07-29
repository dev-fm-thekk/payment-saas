import type { OrderRequest, PaymentRequest, RefundRequest, AccountRequest, TransactionFilters, Webhook, WebhookVerificationRequest, UpdateWebhookRequest } from './types/requests';
import type { OrderResponse, PaymentResponse, RefundResponse, TransactionResponse, AccountResponse, WebhookResponse } from './types/responses';

export interface IPaymentProvider {
  createOrder(request: OrderRequest): Promise<OrderResponse>;
  pay(request: PaymentRequest): Promise<PaymentResponse>;
  capturePayment(paymentId: string, amount: number, currency: string): Promise<PaymentResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  getTransaction(id: string): Promise<TransactionResponse>;
  createAccount(request: AccountRequest): Promise<AccountResponse>;
  createPlan(request: any): Promise<any>;
  listTransactions(filters: TransactionFilters): Promise<TransactionResponse[]>;
  // ─── Webhook management ────────────────────────────────────────────
  createWebHook(request: Webhook): Promise<WebhookResponse>;
  listWebhook(webhookId: string, accountId: string): Promise<WebhookResponse>;
  updateWebhook(request: UpdateWebhookRequest): Promise<WebhookResponse>;
  deleteWebhook(webhookId: string, accountId?: string): Promise<{ deleted: boolean }>;
  verifyWebhookSignature(request: WebhookVerificationRequest): boolean;
}
