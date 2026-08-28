import { createPaymentLink } from "./payment-link.helper"
import z from 'zod';

const PaymentLinkSchema = z.object({
    id: z.uuid(),
    companyId: z.string(),
    provider: z.string(),
    url: z.string(),
    status: z.string(),
    createdAt: z.date().or(z.string()),
    expiresAt: z.date().or(z.string()),
})


const createPaymentLinkSchema = PaymentLinkSchema.omit({
    id: true,
    status: true,
    createdAt: true
})

export const createPaymentLinkController = async (req: any, res: any) => {
    const { data, error } = createPaymentLinkSchema.safeParse(req.body);

    // returning 400 bad request for malformed request body
    if (error) return res.status(400).send({
        status: 'failied',
        service: 'payment-link | create',
        error: error.message,
    })


    try {
        const response = await createPaymentLink(data); 
        
        // upon success returning data
        return res.status(201).send({
            status: 'succeess',
            data: response,
            service: 'payment-link | create'
        })
    } catch(err) {
        res.status(500).send({
            error: err instanceof Error ? err.message : 'internal server error',
            status: 'failed',
            service: 'payment-link | create'
        })
    }
}