import { ProviderName, PaymentStatus, RefundStatus, AccountStatus, OrderStatus } from './types/enums';
import type { OrderResponse, PaymentResponse, RefundResponse, TransactionResponse, AccountResponse } from './types/responses';

export class ResponseNormaliser {
  normaliseOrder(raw: any, provider: ProviderName): OrderResponse {
    if (provider === ProviderName.RAZORPAY) {
      return {
        id: raw.id,
        amount: raw.amount,
        currency: raw.currency,
        status: this.mapRazorpayOrderStatus(raw.status),
        metadata: raw.notes,
        providerOrderId: raw.id,
        createdAt: new Date(raw.created_at * 1000),
        updatedAt: new Date(raw.created_at * 1000),
      };
    } else if (provider === ProviderName.STRIPE) {
      return {
        id: raw.id,
        amount: raw.amount,
        currency: raw.currency.toUpperCase(),
        status: OrderStatus.CREATED,
        metadata: raw.metadata,
        providerOrderId: raw.id,
        createdAt: new Date(raw.created * 1000),
        updatedAt: new Date(raw.created * 1000),
      };
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  normalisePayment(raw: any, provider: ProviderName): PaymentResponse {
    if (provider === ProviderName.RAZORPAY) {
      return {
        id: raw.id,
        status: this.mapRazorpayStatus(raw.status),
        amount: raw.amount,
        currency: raw.currency,
        provider: ProviderName.RAZORPAY,
        providerTransactionId: raw.id,
        createdAt: new Date(raw.created_at * 1000),
        metadata: raw.notes,
      };
    } else if (provider === ProviderName.STRIPE) {
        return {
            id: raw.id,
            status: this.mapStripeStatus(raw.status),
            amount: raw.amount,
            currency: raw.currency.toUpperCase(),
            provider: ProviderName.STRIPE,
            providerTransactionId: raw.id,
            createdAt: new Date(raw.created * 1000),
            metadata: raw.metadata,
          };
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  normaliseRefund(raw: any, provider: ProviderName): RefundResponse {
    if (provider === ProviderName.RAZORPAY) {
      return {
        id: raw.id,
        transactionId: raw.payment_id,
        amount: raw.amount,
        currency: raw.currency,
        status: this.mapRazorpayRefundStatus(raw.status),
        provider: ProviderName.RAZORPAY,
        createdAt: new Date(raw.created_at * 1000),
      };
    } else if (provider === ProviderName.STRIPE) {
        return {
            id: raw.id,
            transactionId: raw.payment_intent,
            amount: raw.amount,
            currency: raw.currency.toUpperCase(),
            status: this.mapStripeRefundStatus(raw.status),
            provider: ProviderName.STRIPE,
            createdAt: new Date(raw.created * 1000),
          };
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  normaliseTransaction(raw: any, provider: ProviderName): TransactionResponse {
    const payment = this.normalisePayment(raw, provider);
    return {
      ...payment,
      refunds: [], // This would ideally be populated by a separate call if needed or if raw contains it
      updatedAt: new Date(),
    };
  }

  normaliseAccount(raw: any, provider: ProviderName): AccountResponse {
    if (provider === ProviderName.RAZORPAY) {
      return {
        id: raw.id,
        provider: ProviderName.RAZORPAY,
        providerAccountId: raw.id,
        status: AccountStatus.ACTIVE, // Simplification
        createdAt: new Date(raw.created_at * 1000),
      };
    } else if (provider === ProviderName.STRIPE) {
        return {
            id: raw.id,
            provider: ProviderName.STRIPE,
            providerAccountId: raw.id,
            status: raw.details_submitted ? AccountStatus.ACTIVE : AccountStatus.PENDING_VERIFICATION,
            createdAt: new Date(raw.created * 1000),
          };
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private mapRazorpayOrderStatus(status: string): OrderStatus {
    switch (status) {
      case 'created': return OrderStatus.CREATED;
      case 'attempted': return OrderStatus.CREATED;
      case 'paid': return OrderStatus.PAID;
      default: return OrderStatus.CREATED;
    }
  }

  private mapRazorpayStatus(status: string): PaymentStatus {
    switch (status) {
      case 'created': return PaymentStatus.PENDING;
      case 'authorized': return PaymentStatus.PROCESSING;
      case 'captured': return PaymentStatus.SUCCEEDED;
      case 'refunded': return PaymentStatus.SUCCEEDED;
      case 'failed': return PaymentStatus.FAILED;
      default: return PaymentStatus.PENDING;
    }
  }

  private mapStripeStatus(status: string): PaymentStatus {
    switch (status) {
      case 'requires_payment_method': return PaymentStatus.PENDING;
      case 'requires_confirmation': return PaymentStatus.PENDING;
      case 'requires_action': return PaymentStatus.PENDING;
      case 'processing': return PaymentStatus.PROCESSING;
      case 'succeeded': return PaymentStatus.SUCCEEDED;
      case 'requires_capture': return PaymentStatus.PROCESSING;
      case 'canceled': return PaymentStatus.CANCELLED;
      default: return PaymentStatus.PENDING;
    }
  }

  private mapRazorpayRefundStatus(status: string): RefundStatus {
    switch (status) {
      case 'processed': return RefundStatus.SUCCEEDED;
      case 'pending': return RefundStatus.PENDING;
      case 'failed': return RefundStatus.FAILED;
      default: return RefundStatus.PENDING;
    }
  }

  private mapStripeRefundStatus(status: string): RefundStatus {
    switch (status) {
      case 'succeeded': return RefundStatus.SUCCEEDED;
      case 'pending': return RefundStatus.PENDING;
      case 'failed': return RefundStatus.FAILED;
      case 'canceled': return RefundStatus.FAILED;
      default: return RefundStatus.PENDING;
    }
  }
}
