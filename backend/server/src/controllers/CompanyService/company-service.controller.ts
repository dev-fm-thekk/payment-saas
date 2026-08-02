import type { Request, Response, NextFunction } from 'express';
import {
    CreateCompanyServiceInputSchema,
    UpdateCompanyServiceInputSchema,
    validateSchema
} from '../../../utils/schema';
import { createService, deleteService, getServiceById, getServicesByCompany, updateService } from './company-service.helper';

export const createServiceController = async (req: any,  res: any,  next: any) => {
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
};

export const getServicesByCompanyController = async (req: any,  res: any,  next: any) => {
    try {
        const result = await getServicesByCompany(String(req.params.companyId));
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
};

export const getServiceByIdController = async (req: any,  res: any,  next: any) => {
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
};

export const updateServiceController = async (req: any,  res: any,  next: any) => {
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
};

export const deleteServiceController = async (req: any,  res: any,  next: any) => {
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
};
