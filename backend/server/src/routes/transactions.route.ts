import { Router } from 'express';
import * as Controller from '../controllers/transactions/transactions.controller';
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get('/list/:companyId/:serviceId', authenticate, Controller.listTransactionController);
router.get('/:companyId/:serviceId/id/info', authenticate, Controller.fetchTransactionController);

export default router;
