import { ProviderName, PaymentStatus, RefundStatus, AccountStatus, OrderStatus } from './types/enums';
import type { OrderResponse, PaymentResponse, RefundResponse, TransactionResponse, AccountResponse, PaymentLinkResponse } from './types/responses';

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

  normalisePaymentLink(raw: any, provider: ProviderName): PaymentLinkResponse {
    switch (provider) {
      case ProviderName.RAZORPAY:
        return {
          id: raw.id,
          currency: raw.currency,
          // Razorpay status is a string ('created', 'paid', 'expired', 'cancelled').
          // Map it to the boolean `status` field: true = link is still usable.
          status: this.mapRazorpayLinkStatus(raw.status),
          callback_url: raw.callback_url,
          callback_method: raw.callback_method,
          upi_link: raw.upi_link,
          // Razorpay exposes the short shareable URL on `short_url`
          url: raw.short_url,
          // Razorpay amounts are already in the smallest currency unit (paise)
          amount: raw.amount,
          amount_paid: raw.amount_paid,
          created_at: raw.created_at,
          // Razorpay embeds line items under `line_items` (array of objects)
          items: Array.isArray(raw.line_items)
            ? raw.line_items.map((li: any) => ({
                quantity: li.quantity ?? 1,
                price: li.unit_amount ?? li.amount,
              }))
            : undefined,
        };

      case ProviderName.STRIPE:
        return {
          id: raw.id,
          currency: raw.currency?.toUpperCase(),
          // Stripe exposes a boolean `active` field directly on the PaymentLink object
          status: raw.active === true,
          callback_url: raw.after_completion?.redirect?.url ?? '',
          // Stripe does not have a UPI-specific link concept
          upi_link: false,
          // Stripe's shareable link is on `url`
          url: raw.url,
          // Stripe stores the total in the smallest currency unit (cents)
          amount: raw.amount_total ?? 0,
          // `amount_paid` is not natively on Stripe's PaymentLink object;
          // it would require a separate checkout session lookup
          amount_paid: undefined,
          created_at: raw.created,
          // Stripe line items are nested under `line_items.data` when expanded
          items: Array.isArray(raw.line_items?.data)
            ? raw.line_items.data.map((li: any) => ({
                quantity: li.quantity ?? 1,
                priceId: li.price?.id,
                price: li.price?.unit_amount,
              }))
            : undefined,
        };

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private mapRazorpayLinkStatus(status: string): boolean {
    // Only 'created' links are still active/usable
    return status === 'created';
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
