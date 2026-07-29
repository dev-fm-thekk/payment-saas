import express from 'express';
import { authenticate, type AuthRequest } from '../../middlewares/auth.middleware';
import {
    CreateUserInputSchema,
    UpdateUserInputSchema,
    validateSchema
} from '../../../utils/schema';
import { createUser, getUserById, updateUser, deleteUser } from '../../services/Auth/user.service';

const userRouter = express.Router();

/** POST /user/register — public */
userRouter.post('/register', async (req, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(CreateUserInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await createUser(data);
        if (result.status === 'failed') {
            const isDuplicate = result.error?.toLowerCase().includes('unique') ||
                                result.error?.toLowerCase().includes('duplicate');
            res.status(isDuplicate ? 409 : 400).json(result);
            return;
        }

        res.status(201).json(result);
    } catch(err) {
        next(err);
    }
});

/** GET /user/me — protected */
userRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ status: 'failed', error: 'Unauthorized' });
            return;
        }
        const result = await getUserById(req.user.id);
        if (result.status === 'failed') {
            res.status(404).json(result);
            return;
        }
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** GET /user/:id — protected */
userRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const id = String(req.params.id);
        if (req.user?.id !== id && req.user?.role !== 'admin') {
            res.status(403).json({ status: 'failed', error: 'Forbidden' });
            return;
        }

        const result = await getUserById(id);
        if (result.status === 'failed') {
            res.status(404).json(result);
            return;
        }
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** PATCH /user/:id — protected */
userRouter.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const id = String(req.params.id);
        if (req.user?.id !== id && req.user?.role !== 'admin') {
            res.status(403).json({ status: 'failed', error: 'Forbidden' });
            return;
        }

        const { error: zodError, data } = validateSchema(UpdateUserInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await updateUser(id, data);
        if (result.status === 'failed') {
            res.status(result.error === 'User not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

/** DELETE /user/:id — protected (admin or own account) */
userRouter.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const id = String(req.params.id);
        if (req.user?.id !== id && req.user?.role !== 'admin') {
            res.status(403).json({ status: 'failed', error: 'Forbidden' });
            return;
        }

        const result = await deleteUser(id);
        if (result.status === 'failed') {
            res.status(result.error === 'User not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

export default userRouter;