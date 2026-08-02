import { Router } from 'express';
import { authenticateApiKey } from '../middlewares/apikey.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createInvoiceController, getInvoice, listInvoices, updateInvoice, deleteInvoice } from '../controllers/Invoice/invoice.controller';

const router = Router();
router.use(authenticateApiKey);

router.post('/', authenticate, createInvoiceController);
router.get('/:companyId/:serviceId/', authenticate, listInvoices);
router.get('/:id', authenticate, getInvoice);
router.patch('/:id', authenticate, updateInvoice);
router.delete('/:id', authenticate, deleteInvoice);

export default router;