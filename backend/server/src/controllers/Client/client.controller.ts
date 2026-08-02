import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import db from "../../../db";
import { client } from "../../../db/schema";
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

        const [newClient] = await db.insert(client).values(data).returning();
        res.status(201).json({ status: 'success', payload: newClient });
    } catch(err) {
        next(err);
    }
};

export const getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const [foundClient] = await db.select().from(client).where(eq(client.id, id));
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
        const clients = await db.select().from(client).where(eq(client.serviceId, serviceId));
        res.status(200).json({ status: 'success', payload: clients });
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

        const [updatedClient] = await db.update(client).set({ ...data, updatedAt: new Date() }).where(eq(client.id, id)).returning();
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
        const [deletedClient] = await db.delete(client).where(eq(client.id, id)).returning();
        if (!deletedClient) {
            res.status(404).send({ message: 'Client not found' });
            return;
        }
        res.status(200).json({ status: 'success', payload: deletedClient });
    } catch(err) {
        next(err);
    }
};
