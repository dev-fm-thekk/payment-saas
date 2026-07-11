import express from 'express';
import { UserSchema, validateSchema } from '../../../utils/schema';
import logger from '../../services/logging/logging.service';
import { createUser } from '../../services/Auth/user.service';

const userRouter = express.Router();

userRouter.post('/register', async (req, res, next) => {
    const CreateUserSchema = UserSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        isVerified: true
    });
    
    try {
        const { error: zodError, data: user } = validateSchema(CreateUserSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await createUser(user);
        
        if (result.status === "failed") {
            const isDuplicate = result.error?.toLowerCase().includes("unique") || 
                                result.error?.toLowerCase().includes("duplicate") ||
                                result.error?.toLowerCase().includes("already exists");
            
            res.status(isDuplicate ? 409 : 400).json({
                service: result.service,
                status: result.status,
                error: result.error || 'Registration failed'
            });
            return;
        }

        res.status(201).json({
            service: result.service,
            status: result.status,
        });
    } catch(err) {
        logger.error(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errMsg });
    }
});

export default userRouter;