import { Router } from 'express';
import * as Controller from '../controllers/transactions/transactions.controller';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateApiKey);

router.get('/list-transactions', authenticate, Controller.listTransactionController);
router.get('/:id/info', authenticate, Controller.fetchTransactionController);

export default router;
