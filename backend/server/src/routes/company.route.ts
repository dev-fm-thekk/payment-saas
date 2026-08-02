import { Router } from 'express';
import * as Controller from '../controllers/Company/company.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/',authenticate, Controller.createCompanyController);
router.get('/', authenticate, Controller.getCompanyByUserController);
router.get('/:id', authenticate, Controller.getCompanyByIdController);
router.patch('/:id', authenticate, Controller.updateCompanyController);
router.delete('/:id', authenticate, Controller.deleteCompanyController);

export default router;
