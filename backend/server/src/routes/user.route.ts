import { Router } from 'express';
import * as Controller from '../controllers/User/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', Controller.createUserController);
router.get('/:id', authenticate, Controller.getUserByIdController);
router.patch('/:id', authenticate, Controller.updateUserController);
router.delete('/:id', authenticate, Controller.deleteUserController);

export default router;
