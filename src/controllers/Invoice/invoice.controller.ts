import z from 'zod';
import { createInvoice } from './invoice.helper';

const InvoiceSchema = z.object({
    id: z.string(),
    invoiceNumber: z.string(),
    title: z.string(),
    description: z.string(),
    clientId: z.string(),
    amount: z.string().transform((value) => parseInt(value)),
    currency: z.string(),
    status: z.string(),
    paymentLinkId: z.string(),
    dueDate: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
})

const CreateInvoiceSchema = InvoiceSchema.omit({
    id: true,
    invoiceNumber: true,
    createdAt: true,
    updatedAt: true
})

export const createInvoiceController = async (req: any, res: any) => {
    const { data, error } = CreateInvoiceSchema.safeParse(req.body);

    if (error) return res.status(400).send({
        status: 'failed',
        service: 'invoice | create',
        error: error
    })

    try {
        const response = await createInvoice(data);

        return res.status(201).send({
            service: 'invoice | create',
            status: 'success',
            data: response
        })

    } catch(err) {
        return res.status(500).send({
            status: 'failed',
            service: 'invoice | create',
            error: err instanceof Error ? err.message : 'unexpected error'
        })
    }
}