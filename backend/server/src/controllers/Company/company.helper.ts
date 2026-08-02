import db from "../../../db";
import { eq } from "drizzle-orm";
import type { CreateServiceType, UpdateServiceType, CreateCompanyInputType, UpdateCompanyInputType } from "../../../utils/schema";
import logger from "../../services/logging/logging.service";
import { companies as CompanyTable } from "../../../db/schema";

export async function createCompany(company: CreateCompanyInputType): Promise<CreateServiceType> {
    try {
        const data = await db.insert(CompanyTable).values(company).returning();
        return { service: 'company', status: 'success', payload: data };
    } catch(err) {
        let message = `CompanyError: Unable to create company.\n${err}`
        logger.error(message)
        return {
            service: 'company',
            status: 'failed',
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

export async function getCompanyById(companyId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(CompanyTable).where(eq(CompanyTable.id, companyId));
        const company = result[0];
        if (!company) return { service: 'company', status: 'failed', error: 'Company not found' };
        return { service: 'company', status: 'success', payload: company };
    } catch(err) {
        logger.error(err);
        return { service: 'company', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function getCompaniesByUser(userId: string): Promise<CreateServiceType & { payload?: any }> {
    try {
        const result = await db.select().from(CompanyTable).where(eq(CompanyTable.userId, userId));
        return { service: 'company', status: 'success', payload: result };
    } catch(err) {
        logger.error(err);
        return { service: 'company', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function updateCompany(companyId: string, data: UpdateCompanyInputType): Promise<UpdateServiceType> {
    try {
        const existing = await db.select({ id: CompanyTable.id }).from(CompanyTable).where(eq(CompanyTable.id, companyId));
        if (!existing[0]) return { service: 'company', status: 'failed', error: 'Company not found' };

        await db.update(CompanyTable).set(data).where(eq(CompanyTable.id, companyId));
        return { service: 'company', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'company', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}

export async function deleteCompany(companyId: string): Promise<CreateServiceType> {
    try {
        const existing = await db.select({ id: CompanyTable.id }).from(CompanyTable).where(eq(CompanyTable.id, companyId));
        if (!existing[0]) return { service: 'company', status: 'failed', error: 'Company not found' };

        await db.delete(CompanyTable).where(eq(CompanyTable.id, companyId));
        return { service: 'company', status: 'success' };
    } catch(err) {
        logger.error(err);
        return { service: 'company', status: 'failed', error: err instanceof Error ? err.message : String(err) };
    }
}