import { PaymentStatus, RefundStatus, AccountStatus, ProviderName, OrderStatus } from './enums';

export interface OrderResponse {
  id: string;
  serviceId?: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  metadata?: Record<string, string>;
  providerOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: ProviderName;
  providerTransactionId: string;
  createdAt: Date;
  metadata?: Record<string, string>;
}

export interface RefundResponse {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  provider: ProviderName;
  createdAt: Date;
}

export interface TransactionResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: ProviderName;
  providerTransactionId: string;
  refunds: RefundResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountResponse {
  id: string;
  provider: ProviderName;
  providerAccountId: string;
  status: AccountStatus;
  createdAt: Date;
}

export interface WebhookResponse {
  /** Internal (provider-assigned) webhook ID */
  id: string;
  /** Registered callback URL */
  url: string;
  /** Events subscribed to */
  events: string[];
  /** Whether the webhook is active */
  active: boolean;
  /** Alert email if set */
  alertEmail?: string;
  /** Provider this webhook belongs to */
  provider: ProviderName;
  createdAt: Date;
  updatedAt: Date;
}
