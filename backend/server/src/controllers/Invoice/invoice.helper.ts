import db from "../../../db";
import { invoice, paymentLink } from "../../../db/schema";
import type { CreateServiceType } from "../../../utils/schema";
import logger from "../../services/logging/logging.service";

export async function createInvoiceRecord(data: any): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.transaction(async (tx) => {
            const [newInvoice] = await tx.insert(invoice).values({
                invoiceNumber: data.invoiceNumber,
                title: data.title,
                description: data.description,
                clientId: data.clientId,
                amountMinor: data.amountMinor,
                currency: data.currency,
                dueDate: data.dueDate,
                status: "sent"
            }).returning();

            const [newPaymentLink] = await tx.insert(paymentLink).values({
                invoiceId: newInvoice!.id,
                linkUrl: data.paymentLinkUrl,
                provider: data.providerName,
                providerRef: data.providerRef,
            }).returning();

            return { invoice: newInvoice, paymentLink: newPaymentLink };
        });

        return { service: 'invoice-service', status: 'success', payload: result };
    } catch(err) {
        logger.error(err);
        return { service: 'invoice-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}
