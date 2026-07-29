import express from 'express';
import { authenticateApiKey } from '../../middlewares/apikey.middleware';
import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
    ListTransactionsRequestSchema,
    validateSchema,
} from '../../../utils/schema';
import { listTransactions } from '../../services/transactions/transaction.service';
import z from 'zod';

const transactionRouter = express.Router();

// All other payment routes are API-key authenticated
transactionRouter.use(authenticateApiKey);

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
transactionRouter.get('/list-transactions', async (req: ApiKeyRequest, res, next) => {
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

transactionRouter.get('/:id/info', async (req: ApiKeyRequest, res, next) => {

    const { id } = req.params;
    try {
         
    }  catch(err) {
        next(err);
    }
})

export default transactionRouter;
