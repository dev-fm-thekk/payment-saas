import db from "../../../db";
import { eq } from "drizzle-orm";
import type { CreateServiceType, UpdateServiceType, CreateCompanyServiceInputType, UpdateCompanyServiceInputType } from "../../../utils/schema";
import logger from "../logging/logging.service";
import { services as ServicesTable } from "../../../db/schema";

export async function createService(service: CreateCompanyServiceInputType): Promise<CreateServiceType> {
    try {
        await db.insert(ServicesTable).values(service);
        return { service: 'company-services', status: 'success' };
    } catch(err) {
        let message = `ServiceError: Unable to create service.\n${err}`
        logger.error(message)
        return {
            service: 'company-services',
            status: 'failed',
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

export async function getServiceById(serviceId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(ServicesTable).where(eq(ServicesTable.id, serviceId));
        const svc = result[0];
        if (!svc) return { service: 'company-services', status: 'failed', error: 'Service not found' };
        return { service: 'company-services', status: 'success', payload: svc };
    } catch(err) {
        logger.error(err);
        return { service: 'company-services', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function getServicesByCompany(companyId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(ServicesTable).where(eq(ServicesTable.companyId, companyId));
        return { service: 'company-services', status: 'success', payload: result };
    } catch(err) {
        logger.error(err);
        return { service: 'company-services', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateService(serviceId: string, data: UpdateCompanyServiceInputType): Promise<UpdateServiceType> {
    try {
        const existing = await db.select({ id: ServicesTable.id }).from(ServicesTable).where(eq(ServicesTable.id, serviceId));
        if (!existing[0]) return { service: 'company-services', status: 'failed', error: 'Service not found' };

        await db.update(ServicesTable).set(data).where(eq(ServicesTable.id, serviceId));
        return { service: 'company-services', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'company-services', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteService(serviceId: string): Promise<CreateServiceType> {
    try {
        const existing = await db.select({ id: ServicesTable.id }).from(ServicesTable).where(eq(ServicesTable.id, serviceId));
        if (!existing[0]) return { service: 'company-services', status: 'failed', error: 'Service not found' };

        await db.delete(ServicesTable).where(eq(ServicesTable.id, serviceId));
        return { service: 'company-services', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'company-services', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}