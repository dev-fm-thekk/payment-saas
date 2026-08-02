import db from "../../../db";
import { eq } from "drizzle-orm";
import { providerConfigs } from "../../../db/schema";
import type { CreateServiceType, UpdateServiceType, CreateProviderConfigInputType, UpdateProviderConfigInputType } from "../../../utils/schema";
import logger from "../../services/logging/logging.service";

export async function addProvider(provider: CreateProviderConfigInputType): Promise<CreateServiceType> {
    try {
        await db.insert(providerConfigs).values(provider);
        return { service: 'provider-service', status: 'success' };
    } catch(err) {
        logger.error(err);
        return {
            service: 'provider-service',
            status: 'failed',
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

export async function getProviderById(providerId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(providerConfigs).where(eq(providerConfigs.id, providerId));
        const provider = result[0];
        if (!provider) return { service: 'provider-service', status: 'failed', error: 'Provider config not found' };
        return { service: 'provider-service', status: 'success', payload: provider };
    } catch(err) {
        logger.error(err);
        return { service: 'provider-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function getProvidersByService(serviceId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(providerConfigs).where(eq(providerConfigs.serviceId, serviceId));
        return { service: 'provider-service', status: 'success', payload: result };
    } catch(err) {
        logger.error(err);
        return { service: 'provider-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateProvider(providerId: string, data: UpdateProviderConfigInputType): Promise<UpdateServiceType> {
    try {
        const existing = await db.select({ id: providerConfigs.id }).from(providerConfigs).where(eq(providerConfigs.id, providerId));
        if (!existing[0]) return { service: 'provider-service', status: 'failed', error: 'Provider config not found' };

        await db.update(providerConfigs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(providerConfigs.id, providerId));
        return { service: 'provider-service', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'provider-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteProvider(providerId: string): Promise<CreateServiceType> {
    try {
        const existing = await db.select({ id: providerConfigs.id }).from(providerConfigs).where(eq(providerConfigs.id, providerId));
        if (!existing[0]) return { service: 'provider-service', status: 'failed', error: 'Provider config not found' };

        await db.delete(providerConfigs).where(eq(providerConfigs.id, providerId));
        return { service: 'provider-service', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'provider-service', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}