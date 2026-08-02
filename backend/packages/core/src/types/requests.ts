import { OrderStatus } from './enums';

export interface OrderRequest {
  amount: number;
  currency: string;
  serviceId?: string;
  description?: string;
  receipt?: string;
  metadata?: Record<string, string>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  customerId?: string;
  receipt?: string;
  metadata?: Record<string, string>;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface AccountRequest {
  email: string;
  businessName: string;
  country: string;
  metadata?: Record<string, string>;
}

export interface TransactionFilters {
  from?: Date;
  to?: Date;
  status?: string;
  limit?: number;
  cursor?: string;
}


export interface Webhook {
  url: string;
  events: Array<string>;
  secret?: string;
  alert_email?: string;
  /** Provider-assigned webhook ID (used when fetching/updating) */
  id?: string;
  /** Account/entity ID this webhook is scoped to (Razorpay: account_id) */
  accountId?: string;
}

export interface WebhookVerificationRequest {
  /** Raw request body (Buffer or string) */
  rawBody: string | Buffer;
  /** Value of the provider's signature header */
  signature: string;
  /** Webhook secret used when the webhook was registered */
  secret: string;
}

export interface UpdateWebhookRequest {
  webhookId: string;
  accountId?: string;
  url?: string;
  events?: Array<string>;
  secret?: string;
  alert_email?: string;
}

export interface Item {
  quantity: number,
  priceId?: string,
  price?: number,
}

export interface Customer {
  name: string,
  email: string,
  contact: string,
}

export interface PaymentLinkRequest {
  id?: string;
  item: Item[];
  currency: string;
  status?: boolean;
  callback_url: string;
  callback_method?: string;
  upi_link?: boolean;
  description?: string;
  metadata?: Record<string, string>;
  customer?: Customer;
}