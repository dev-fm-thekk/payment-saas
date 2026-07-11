import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
    CreateProviderConfigInputSchema,
    UpdateProviderConfigInputSchema,
    validateSchema
} from '../../../utils/schema';
import {
    addProvider,
    getProviderById,
    getProvidersByService,
    updateProvider,
    deleteProvider
} from '../../services/Providers/provider.service';

const providerRouter = express.Router();

/** POST /provider — add a provider config for a service */
providerRouter.post('/', authenticate, async (req, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(CreateProviderConfigInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await addProvider(data);
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

/** GET /provider/service/:serviceId — list all providers for a service */
providerRouter.get('/service/:serviceId', authenticate, async (req, res, next) => {
    try {
        const result = await getProvidersByService(String(req.params.serviceId));
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** GET /provider/:id — get a specific provider config */
providerRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await getProviderById(String(req.params.id));
        if (result.status === 'failed') {
            res.status(404).json(result);
            return;
        }
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** PATCH /provider/:id — update provider credentials */
providerRouter.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(UpdateProviderConfigInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await updateProvider(String(req.params.id), data);
        if (result.status === 'failed') {
            res.status(result.error === 'Provider config not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

/** DELETE /provider/:id — remove a provider config */
providerRouter.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await deleteProvider(String(req.params.id));
        if (result.status === 'failed') {
            res.status(result.error === 'Provider config not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

export default providerRouter;
