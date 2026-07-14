import express from 'express';
import { authenticateApiKey } from '../../middlewares/apikey.middleware';
import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
    PayRequestSchema,
    RefundRequestSchema,
    ListTransactionsRequestSchema,
    validateSchema,
} from '../../../utils/schema';
import { processPayment, processRefund, listTransactions } from '../../services/Payment/payment.service';

const paymentRouter = express.Router();

// All payment routes are API-key authenticated
paymentRouter.use(authenticateApiKey);

/**
 * POST /payment/pay
 *
 * Creates an order and initiates a payment through the provider configured
 * for the given serviceId.
 *
 * Body:
 *   serviceId  - UUID of the service (determines the provider)
 *   amount     - Integer amount in smallest currency unit (e.g. paise / cents)
 *   currency   - ISO-4217 currency code (3 chars)
 *   description? - Optional description
 *   receipt?   - Optional receipt reference
 *   metadata?  - Optional key-value pairs
 */
paymentRouter.post('/pay', async (req: ApiKeyRequest, res, next) => {
    try {
        req.body.amount = parseInt(req.body.amount)
        const { error: zodError, data } = validateSchema(PayRequestSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues
                    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                    .join(', '),
            });
            return;
        }

        const result = await processPayment(data, req.companyId!);
        if (result.status === 'failed') {
            res.status(400).json(result);
            return;
        }

        res.status(201).json(result);
    } catch (err) {
        console.log(err);
        next(err);
    }
});

/**
 * POST /payment/refund
 *
 * Issues a refund for a previously succeeded payment.
 *
 * Body:
 *   serviceId  - UUID of the service
 *   paymentId  - Internal payment ID (UUID from the payments table)
 *   amount?    - Partial refund amount; omit for full refund
 *   reason?    - Optional reason string
 *   metadata?  - Optional key-value pairs
 */
paymentRouter.post('/refund', async (req: ApiKeyRequest, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(RefundRequestSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues
                    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                    .join(', '),
            });
            return;
        }

        const result = await processRefund(data, req.companyId!);
        if (result.status === 'failed') {
            const isNotFound = result.error?.includes('not found') || result.error?.includes('access denied');
            res.status(isNotFound ? 404 : 400).json(result);
            return;
        }

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /payment/list-transactions
 *
 * Lists transactions for a service from the upstream provider.
 *
 * Query params:
 *   serviceId  - UUID of the service (required)
 *   from?      - ISO date string
 *   to?        - ISO date string
 *   status?    - Filter by status string
 *   limit?     - Max results (default 20, max 100)
 *   cursor?    - Pagination cursor
 */
paymentRouter.get('/list-transactions', async (req: ApiKeyRequest, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(ListTransactionsRequestSchema, req.query);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues
                    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                    .join(', '),
            });
            return;
        }

        const result = await listTransactions(data, req.companyId!);
        if (result.status === 'failed') {
            res.status(400).json(result);
            return;
        }

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

export default paymentRouter;
