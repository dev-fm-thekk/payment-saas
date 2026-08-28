import crypto from 'crypto';
import db from '../../../db';
import { webhookEndpoints, webhookEvents } from '../../../db/schema';
import { eq } from 'drizzle-orm';

type WebhookEndpoint = {
    id: string,
    companyId: string,
    provider: string,
    url: string,
    createdAt: string
}

type CreateWebhookEndpoint = Omit<WebhookEndpoint, "id" | "createdAt" | "url">;

type WebhookEvents = {
    payload: any,
    received_at: string,
    webhookEndpoint: string
};

const BASE_URL = 'http://localhost:3001/api/v1';

function generateWebhookUrl(provider: string, companyId: string): string {
    let uniqueSecret = crypto.randomBytes(16).toString('hex');
    
    let url = `${BASE_URL}/webhook/${companyId}/${provider}/${uniqueSecret}`;

    return url;
}

export const createWebhook = async (input: CreateWebhookEndpoint) => {
    let { provider, companyId } = input;
    let url = generateWebhookUrl(provider, companyId);
    let insertData = {
        ...input,
        url,
    }
    let response = await db.insert(webhookEndpoints).values(insertData).returning();
    if (response.length < 1) throw new Error("DB Error: unable to insert values in webhook_endpoints table");
    return response;
}

export const handleWebhook = async (input: WebhookEvents) => {
    let webhookEndpoint = await db.select({ id: webhookEndpoints.id }).from(webhookEndpoints).where(eq(webhookEndpoints.url, input.webhookEndpoint)).limit(1);

    if (webhookEndpoint.length < 1) return 'WEBHOOK_ENDPOINT_NOT_FOUND';

    let webhookEndpointId = webhookEndpoint[0]?.id as string;

    let insertData = {
        payload: input.payload,
        received_at: input.received_at,
        webhookEndpointId: webhookEndpointId,
    }
    let response = await db.insert(webhookEvents).values(insertData).returning();
    if (response.length < 1) throw new Error("DB Error: unable to insert value in webhook_events table");

    return response;
}