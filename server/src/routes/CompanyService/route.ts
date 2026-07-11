import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
    CreateCompanyServiceInputSchema,
    UpdateCompanyServiceInputSchema,
    validateSchema
} from '../../../utils/schema';
import {
    createService,
    getServiceById,
    getServicesByCompany,
    updateService,
    deleteService
} from '../../services/CompanyServices/company-service.service';

const companyServiceRouter = express.Router();

/** POST /service — create a new service under a company */
companyServiceRouter.post('/', authenticate, async (req, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(CreateCompanyServiceInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await createService(data);
        if (result.status === 'failed') {
            res.status(400).json(result);
            return;
        }
        res.status(201).json(result);
    } catch(err) {
        next(err);
    }
});

/** GET /service/company/:companyId — list all services for a company */
companyServiceRouter.get('/company/:companyId', authenticate, async (req, res, next) => {
    try {
        const result = await getServicesByCompany(String(req.params.companyId));
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** GET /service/:id — get a specific service */
companyServiceRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await getServiceById(String(req.params.id));
        if (result.status === 'failed') {
            res.status(404).json(result);
            return;
        }
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** PATCH /service/:id — update a service */
companyServiceRouter.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(UpdateCompanyServiceInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await updateService(String(req.params.id), data);
        if (result.status === 'failed') {
            res.status(result.error === 'Service not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

/** DELETE /service/:id — delete a service */
companyServiceRouter.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await deleteService(String(req.params.id));
        if (result.status === 'failed') {
            res.status(result.error === 'Service not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

export default companyServiceRouter;
