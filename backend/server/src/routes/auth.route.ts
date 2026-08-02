import { Router } from 'express';
import { loginController, logoutController, refreshTokenController, apiKeyController } from '../controllers/Auth/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshTokenController);
router.post('/api-key', authenticate, apiKeyController);

export default router;
