import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import db from "../../../db";
import { clients } from "../../../db/schema";
import { eq } from "drizzle-orm";

const createClientSchema = z.object({
    name: z.string(),
    email: z.string().email().optional(),
    serviceId: z.string().uuid()
});

const updateClientSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional()
});

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { data, error } = createClientSchema.safeParse(req.body);
        if (error) {
            res.status(400).send({ message: 'Validation failed', error: error.issues });
            return;
        }

        const [newClient] = await db.insert(clients).values(data).returning();
        res.status(201).json({ status: 'success', payload: newClient });
    } catch(err) {
        next(err);
    }
};

export const getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const [foundClient] = await db.select().from(clients).where(eq(clients.id, id as string));
        if (!foundClient) {
            res.status(404).send({ message: 'Client not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: foundClient });
    } catch(err) {
        next(err);
    }
};

export const listClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { serviceId } = req.params;
        const fetchedClients = await db.select().from(clients).where(eq(clients.serviceId, serviceId as string));
        res.status(200).json({ status: 'success', payload: fetchedClients });
    } catch(err) {
        next(err);
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { data, error } = updateClientSchema.safeParse(req.body);
        if (error) {
            res.status(400).send({ message: 'Validation failed', error: error.issues });
            return;
        }

        const [updatedClient] = await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id as string)).returning();
        if (!updatedClient) {
            res.status(404).send({ message: 'Client not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: updatedClient });
    } catch(err) {
        next(err);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const [deletedClient] = await db.delete(clients).where(eq(clients.id, id as string)).returning();
        if (!deletedClient) {
            res.status(404).send({ message: 'Client not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: deletedClient });
    } catch(err) {
        next(err);
    }
};
