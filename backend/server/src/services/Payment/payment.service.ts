import db from '../../../db';
import { eq, and } from 'drizzle-orm';
import { providerConfigs, orders, payments, refunds, services } from '../../../db/schema';
import { ProviderFactory, ProviderName } from '@payment-sdk/core';
import type { PayRequestType, RefundRequestType, ListTransactionsRequestType } from '../../../utils/schema';
import logger from '../logging/logging.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves the active provider config for a given serviceId, validates that the
 * service belongs to the calling company, then decrypts the raw credentials and
 * returns an initialised adapter.
 */
async function resolveAdapter(serviceId: string, companyId: string) {
    // Validate that the service belongs to this company
    const svc = await db
        .select({ id: services.id, currency: services.currency })
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.companyId, companyId)))
        .limit(1);

    if (!svc[0]) {
        return { error: 'Service not found or does not belong to your company', data: null };
    }

    // Fetch the first active provider config for this service
    const configs = await db
        .select()
        .from(providerConfigs)
        .where(eq(providerConfigs.serviceId, serviceId))
        .limit(1);

    if (!configs[0]) {
        return { error: 'No provider configured for this service', data: null };
    }

    const config = configs[0];

    // credentialsEncrypted stores the raw credentials JSON (apiKey, apiSecret, etc.)
    const credentials = config.credentialsEncrypted as { apiKey: string; apiSecret?: string; webhookSecret?: string };

    const providerName =
        config.provider === 'stripe' ? ProviderName.STRIPE : ProviderName.RAZORPAY;

    const adapter = ProviderFactory.create({
        provider: providerName,
        credentials,
    });

    return { error: null, data: { adapter, provider: config.provider, service: svc[0] } };
}

// ─── Pay ─────────────────────────────────────────────────────────────────────

export async function processPayment(input: PayRequestType, companyId: string) {
    try {
        const resolved = await resolveAdapter(input.serviceId, companyId);
        if (resolved.error || !resolved.data) {
            return { status: 'failed' as const, error: resolved.error };
        }
        const { adapter, provider } = resolved.data;

        // 1. Create the order record in the DB first
        const orderRows = await db
            .insert(orders)
            .values({
                serviceId: input.serviceId,
                amount: String(input.amount),
                currency: input.currency.toUpperCase(),
                status: 'created',
                metadata: input.metadata ?? {},
            })
            .returning();
        const order = orderRows[0];
        if (!order) throw new Error('Failed to create order record');

        // 2. Create the provider-side order (e.g. Razorpay order / Stripe PaymentIntent)
        let providerPaymentId: string;
        let rawProviderResponse: any;

        try {
            const orderResponse = await adapter.createOrder({
                amount: input.amount,
                currency: input.currency,
                description: input.description,
                receipt: input.receipt ?? order.id,
                metadata: input.metadata,
            });
            providerPaymentId = orderResponse.providerOrderId ?? orderResponse.id;
            rawProviderResponse = orderResponse;
        } catch (providerErr) {
            // Mark the DB order as failed if the provider call fails
            await db
                .update(orders)
                .set({ status: 'failed', updatedAt: new Date() })
                .where(eq(orders.id, order.id));
            logger.error(providerErr);
            const msg = providerErr instanceof Error ? providerErr.message : String(providerErr);
            return { status: 'failed' as const, error: `Provider error: ${msg}` };
        }

        // 3. Record the payment row
        const paymentRows = await db
            .insert(payments)
            .values({
                orderId: order.id,
                provider,
                providerPaymentId,
                status: 'pending',
                rawResponse: rawProviderResponse,
            })
            .returning();
        const payment = paymentRows[0];
        if (!payment) throw new Error('Failed to create payment record');

        return {
            status: 'success' as const,
            data: {
                orderId: order.id,
                paymentId: payment.id,
                providerPaymentId,
                provider,
                amount: order.amount,
                currency: order.currency,
                orderStatus: order.status,
                paymentStatus: payment.status,
            },
        };
    } catch (err) {
        logger.error(err);
        return { status: 'failed' as const, error: err instanceof Error ? err.message : String(err) };
    }
}

// ─── Refund ──────────────────────────────────────────────────────────────────

export async function processRefund(input: RefundRequestType, companyId: string) {
    try {
        // Look up the payment and verify it belongs to an order under this company's service
        const paymentRows = await db
            .select({
                payment: payments,
                order: orders,
            })
            .from(payments)
            .innerJoin(orders, eq(payments.orderId, orders.id))
            .innerJoin(services, eq(orders.serviceId, services.id))
            .where(
                and(
                    eq(payments.id, input.paymentId),
                    eq(services.companyId, companyId),
                    eq(orders.serviceId, input.serviceId)
                )
            )
            .limit(1);

        if (!paymentRows[0]) {
            return { status: 'failed' as const, error: 'Payment not found or access denied' };
        }

        const { payment, order } = paymentRows[0];

        if (payment.status !== 'succeeded') {
            return { status: 'failed' as const, error: 'Only succeeded payments can be refunded' };
        }

        const resolved = await resolveAdapter(input.serviceId, companyId);
        if (resolved.error || !resolved.data) {
            return { status: 'failed' as const, error: resolved.error };
        }
        const { adapter } = resolved.data;

        // Call the provider
        const refundResponse = await adapter.refund({
            transactionId: payment.providerPaymentId,
            amount: input.amount,
            reason: input.reason,
            metadata: input.metadata,
        });

        // Persist the refund record
        const refundRows = await db
            .insert(refunds)
            .values({
                paymentId: payment.id,
                providerRefundId: refundResponse.id,
                amount: String(refundResponse.amount),
                status: 'pending',
                reason: input.reason,
            })
            .returning();
        const refund = refundRows[0];
        if (!refund) throw new Error('Failed to create refund record');

        // Update the order status
        const refundAmount = input.amount ?? Number(order.amount);
        const newOrderStatus =
            refundAmount >= Number(order.amount) ? 'refunded' : 'partially_refunded';

        await db
            .update(orders)
            .set({ status: newOrderStatus, updatedAt: new Date() })
            .where(eq(orders.id, order.id));

        return {
            status: 'success' as const,
            data: {
                refundId: refund.id,
                providerRefundId: refundResponse.id,
                paymentId: payment.id,
                amount: refund.amount,
                refundStatus: refund.status,
                orderStatus: newOrderStatus,
            },
        };
    } catch (err) {
        logger.error(err);
        return { status: 'failed' as const, error: err instanceof Error ? err.message : String(err) };
    }
}

// ─── List Transactions ───────────────────────────────────────────────────────

export async function listTransactions(input: ListTransactionsRequestType, companyId: string) {
    try {
        const resolved = await resolveAdapter(input.serviceId, companyId);
        if (resolved.error || !resolved.data) {
            return { status: 'failed' as const, error: resolved.error };
        }
        const { adapter } = resolved.data;

        const transactions = await adapter.listTransactions({
            from: input.from,
            to: input.to,
            status: input.status,
            limit: input.limit,
            cursor: input.cursor,
        });

        return { status: 'success' as const, data: transactions };
    } catch (err) {
        logger.error(err);
        return { status: 'failed' as const, error: err instanceof Error ? err.message : String(err) };
    }
}
