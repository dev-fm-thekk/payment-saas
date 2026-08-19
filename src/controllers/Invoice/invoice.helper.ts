import db from "../../../db";
import { invoices, paymentLinks } from "../../../db/schema";
import type { CreateServiceType } from "../../../utils/schema";
import logger from "../../services/logging/logging.service";

export async function createInvoiceRecord(data: any): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.transaction(async (tx) => {
            const [newPaymentLink] = await tx.insert(paymentLinks).values({
                companyId: data.companyId,
                provider: data.providerName,
                providerSessionId: data.providerRef,
                url: data.paymentLinkUrl,
                status: 'active'
            }).returning();

            const [newInvoice] = await tx.insert(invoices).values({
                invoiceNumber: data.invoiceNumber,
                title: data.title,
                description: data.description,
                clientId: data.clientId,
                amountMinor: data.amountMinor,
                currency: data.currency,
                dueDate: data.dueDate,
                status: "pending",
                paymentLinkId: newPaymentLink!.id
            }).returning();

            

            return { invoice: newInvoice, paymentLink: newPaymentLink };
        });

        return { service: 'invoice-service', status: 'success', payload: result };
    } catch(err) {
        logger.error(err);
        return { service: 'invoice-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}
