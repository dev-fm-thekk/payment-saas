import express from 'express';
import { authenticate, type AuthRequest } from '../../middlewares/auth.middleware';
import {
    CreateCompanyInputSchema,
    UpdateCompanyInputSchema,
    validateSchema
} from '../../../utils/schema';
import {
    createCompany,
    getCompanyById,
    getCompaniesByUser,
    updateCompany,
    deleteCompany
} from '../../services/Companies/company.service';

const companyRouter = express.Router();

/** POST /company — create company for the authenticated user */
companyRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(CreateCompanyInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        // Enforce that the company is created for the authenticated user
        const result = await createCompany({ ...data, userId: req.user!.id });
        if (result.status === 'failed') {
            res.status(400).json(result);
            return;
        }
        res.status(201).json(result);
    } catch(err) {
        next(err);
    }
});

/** GET /company — list all companies for the authenticated user */
companyRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const result = await getCompaniesByUser(req.user!.id);
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** GET /company/:id — get a specific company */
companyRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const result = await getCompanyById(String(req.params.id));
        if (result.status === 'failed') {
            res.status(404).json(result);
            return;
        }
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
});

/** PATCH /company/:id — update a company */
companyRouter.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { error: zodError, data } = validateSchema(UpdateCompanyInputSchema, req.body);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
            return;
        }

        const result = await updateCompany(String(req.params.id), data);
        if (result.status === 'failed') {
            res.status(result.error === 'Company not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

/** DELETE /company/:id — delete a company */
companyRouter.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const result = await deleteCompany(String(req.params.id));
        if (result.status === 'failed') {
            res.status(result.error === 'Company not found' ? 404 : 400).json(result);
            return;
        }
        res.status(200).json(result);
    } catch(err) {
        next(err);
    }
});

export default companyRouter;
