import { Router } from 'express';
import * as Controller from '../controllers/CompanyService/company-service.controller';
import { authenticate } from '../middlewares/auth.middleware';
const router = Router();

router.post('/', authenticate, Controller.createServiceController);
router.get('/company/:companyId', authenticate, Controller.getServicesByCompanyController);
router.get('/:id', authenticate, Controller.getServiceByIdController);
router.patch('/:id', authenticate, Controller.updateServiceController);
router.delete('/:id', authenticate, Controller.deleteServiceController);

export default router;
