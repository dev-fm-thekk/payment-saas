import { Router } from 'express';
import * as Controller from '../controllers/transactions/transactions.controller';
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/*
 * GET /list/:companyId/:serviceId
 * Params: companyId (string), serviceId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: List of transactions on success
 */
router.get('/list/:companyId/:serviceId', authenticate, Controller.listTransactionController);

/*
 * GET /:companyId/:serviceId/id/info
 * Params: companyId (string), serviceId (string)
 * Status Codes: 200 (Success), 404 (Not Found), 500 (Internal Server Error)
 * Returns: Transaction details on success
 */
router.get('/:companyId/:serviceId/id/info', authenticate, Controller.fetchTransactionController);

export default router;
