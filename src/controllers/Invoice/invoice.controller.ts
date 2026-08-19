import { email, z } from "zod";
import { resolveAdapter } from "../../../utils/sdk.utils";
import type { Request, Response, NextFunction } from "express";
import { createInvoiceRecord } from "./invoice.helper";
import db from "../../../db";
import { invoices, clients } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

const createInvoiceSchema = z.object({
    invoiceNumber: z.string(),
    title: z.string(),
    description: z.string(),
    clientId: z.string().uuid(),
    amountMinor: z.coerce.number().int().positive(),
    currency: z.string().length(3),
    dueDate: z.coerce.date().optional(),
    serviceId: z.string(),
});

export const createInvoiceController = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = { ...req.body, companyId: req.companyId };
        
        const { data, error } = createInvoiceSchema.safeParse(payload);
        if (error) {
            res.status(400).send({ message: 'Validation failed', error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
            return;
        }
        
        const { error: adapterError, data: adapterData } = await resolveAdapter(data.serviceId, req.companyId);

        if (adapterError) {
             res.status(500).send({ error: adapterError });
             return;
        }
        
        const { adapter, provider, service } = adapterData!;

        const clientResponse = await db.select({ name: clients.name, email: clients.email}).from(clients).where(eq(clients.id, payload.clientId)).limit(1);
        if (clientResponse.length < 1) throw new Error('client not found');

        const customer = clientResponse[0] as { name: string, email: string, contact: string};

        customer!.contact = "8547376353";

        // 1. Create Payment Link using adapter
        const paymentLinkRes = await adapter.createPaymentLink({
            item: [{ quantity: 1, price: data.amountMinor }], amount: data.amountMinor,
            currency: data.currency,
            callback_url: `https://your-domain.com/invoice/callback`, 
            description: data.description,
            customer: customer,
        });

        // 2. Create Invoice Record in DB
        const result = await createInvoiceRecord({
            companyId: req.companyId,
            ...data,
            paymentLinkUrl: paymentLinkRes.url,
            providerName: provider,
            providerRef: paymentLinkRes.id
        });

        if (result.status === 'failed') {
            res.status(500).json(result);
            return;
        }

        res.status(201).json(result);
    } catch(err) {
        console.log(err);
        next(err);
    }
}

export const getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const [foundInvoice] = await db.select().from(invoices).where(eq(invoices.id, id));
        if (!foundInvoice) {
            res.status(404).send({ message: 'Invoice not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: foundInvoice });
    } catch(err) {
        next(err);
    }
};

export const listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const companyId = req.params.companyId as string;
        const serviceId  = req.params.serviceId as string;
        
        // Find all clients for this service, then their invoices
        const foundClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.serviceId, serviceId));
        const clientIds = foundClients.map(c => c.id);
        
        let fetchedInvoicesList: any[] = [];
        if (clientIds.length > 0) {
            // we should technically query using IN operator, but using or/inArray or loop.
            // drizzle inArray can be used
            const { inArray } = await import("drizzle-orm");
            fetchedInvoicesList = await db.select().from(invoices).where(inArray(invoices.clientId, clientIds));
        }

        res.status(200).json({ status: 'success', payload: fetchedInvoicesList });
    } catch(err) {
        next(err);
    }
};

const updateInvoiceSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'pending', 'paid', 'failed', 'expired']).optional(),
    dueDate: z.coerce.date().optional()
});

export const updateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id  = req.params.id as string;
        const { data, error } = updateInvoiceSchema.safeParse(req.body);
        if (error) {
            res.status(400).send({ message: 'Validation failed', error: error.issues });
            return;
        }
        
        const [updatedInvoice] = await db.update(invoices).set({ ...data, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
        if (!updatedInvoice) {
            res.status(404).send({ message: 'Invoice not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: updatedInvoice });
    } catch (err) {
        next(err);
    }
};

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = req.params.id as string;
        const [deletedInvoice] = await db.delete(invoices).where(eq(invoices.id, id)).returning();
        if (!deletedInvoice) {
            res.status(404).send({ message: 'Invoice not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: deletedInvoice });
    } catch (err) {
        next(err);
    }
};