// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ProviderName {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
}

export enum ErrorCode {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CARD_DECLINED = 'CARD_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  RATE_LIMIT = 'RATE_LIMIT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// ─── Shared primitives ───────────────────────────────────────────────────────

export interface Item {
  quantity: number;
  /** Existing Stripe Price ID — skips ad-hoc price creation */
  priceId?: string;
  /** Unit price in the smallest currency unit (paise / cents) */
  price?: number;
}

export interface Customer {
  name: string;
  email: string;
  contact: string;
}

export interface ProviderCredentials {
  apiKey: string;
  apiSecret?: string;
}

// ─── Payment Link ─────────────────────────────────────────────────────────────

export interface CreatePaymentLinkRequest {
  // item only in stripe
  item?: Item[];
  currency: string;
  callback_url: string;
  description?: string;
  amount: number,
  /** Razorpay: callback HTTP method (default 'get') */
  callback_method?: string;
  /** Razorpay: create a UPI-only payment link */
  upi_link?: boolean;
  metadata?: Record<string, string>;
  /** Razorpay: pre-fill customer details */
  customer?: Customer;
}

export interface CreatePaymentLinkResponse {
  id: string;
  /** Shareable payment URL (Stripe: `url`, Razorpay: `short_url`) */
  url: string;
  /** Total charge in smallest currency unit */
  amount: number;
  currency: string;
  /** true = link is active/usable */
  status: boolean;
  callback_url: string;
  callback_method?: string;
  upi_link?: boolean;
  items?: Item[];
  amount_paid?: number;
  created_at?: number;
  provider: ProviderName;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  secret?: string;
  alert_email?: string;
  /** Razorpay: scope webhook to a specific sub-account */
  accountId?: string;
}

export interface UpdateWebhookRequest {
  webhookId: string;
  accountId?: string;
  url?: string;
  events?: string[];
  secret?: string;
  alert_email?: string;
}

export interface WebhookVerificationRequest {
  /** Raw request body (Buffer or string) */
  rawBody: string | Buffer;
  /** Value of the provider's signature header */
  signature: string;
  /** Webhook secret used when the webhook was registered */
  secret: string;
}

export interface CreateWebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  alertEmail?: string;
  provider: ProviderName;
  createdAt: Date;
  updatedAt: Date;
}