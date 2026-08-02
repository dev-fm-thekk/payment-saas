import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as Controller from '../controllers/Provider/provider.controller';

const router = Router();

router.post('/', authenticate, Controller.addProviderController);
router.get('/service/:serviceId', authenticate, Controller.getProviderByServiceController);
router.get('/:id', authenticate, Controller.getProviderByIdController);
router.patch('/:id', authenticate, Controller.updateProviderController);
router.delete('/:id', authenticate, Controller.deleteProviderController);

export default router;
