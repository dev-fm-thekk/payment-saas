import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
    CreateProviderConfigInputSchema,
    UpdateProviderConfigInputSchema,
    validateSchema
} from '../../../utils/schema';
import { addProvider, deleteProvider, getProviderById, getProvidersByService, updateProvider } from './provider.helper';

export const addProviderController = async (req: any,  res: any,  next: any) => {
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
};

export const getProviderByServiceController = async (req: any,  res: any,  next: any) => {
    try {
        const result = await getProvidersByService(String(req.params.serviceId));
        res.status(200).json({ status: result.status, data: result.payload });
    } catch(err) {
        next(err);
    }
};

export const getProviderByIdController = async (req: any,  res: any,  next: any) => {
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
};

export const updateProviderController = async (req: any,  res: any,  next: any) => {
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
};

export const deleteProviderController = async (req: any,  res: any,  next: any) => {
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
};
