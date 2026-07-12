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
