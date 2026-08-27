/**
 * integration.test.ts
 *
 * End-to-end integration flow:
 *   1. Create a Payment Link   → POST /api/v1/payment-link
 *   2. Create an Invoice       → POST /api/v1/invoice  (internally creates another payment link via the provider)
 *   3. Register a Webhook      → POST /api/v1/webhook
 *   4. Verify the Invoice      → GET  /api/v1/invoice/:id
 *   5. Verify the Webhook      → GET  /api/v1/webhook/:webhookId?serviceId=...
 *
 * Prerequisites (set in .env or TEST_* environment variables):
 *   TEST_SERVICE_ID   – UUID of a service configured with a real provider (Razorpay/Stripe)
 *   TEST_CLIENT_ID    – UUID of a client registered under that service's company
 *
 * A temporary user is created at the start and deleted at the end.
 * The user must own exactly one company so that authenticate() can resolve companyId.
 */
import app from '../src/app';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Integration: Payment Link → Invoice → Webhook', () => {
    const agent = request.agent(app);

    const serviceId = process.env.TEST_SERVICE_ID ?? '';
    const clientId  = process.env.TEST_CLIENT_ID  ?? '';

    let accessToken: string;
    let userId: string;

    // IDs captured to chain tests
    let createdInvoiceId: string;
    let createdWebhookId: string;

    const temp_user = {
        email: 'integration-test-user@example.com',
        name: 'Integration-TestUser',
        password: 'Password.@123',
        role: 'user',
    };

    // ─── Setup / Teardown ──────────────────────────────────────────────────────

    beforeAll(async () => {
        await agent
            .post('/api/v1/user/register')
            .type('form')
            .send({ ...temp_user, passwordHash: temp_user.password });

        const loginRes = await agent
            .post('/api/v1/auth/login')
            .type('form')
            .send({ email: temp_user.email, password: temp_user.password });

        if (!loginRes.ok) {
            console.error('[Integration] Login failed:', loginRes.body);
            throw new Error('Integration test user login failed');
        }

        accessToken = loginRes.body.accessToken as string;
        userId = loginRes.body.user.id as string;
    });

    afterAll(async () => {
        await agent.post('/api/v1/auth/logout');
        await agent
            .delete(`/api/v1/user/${userId}`)
            .set('Authorization', `Bearer ${accessToken}`);
    });

    // ─── Step 1: Create Payment Link ───────────────────────────────────────────

    it('Step 1 — POST /api/v1/payment-link creates a payment link (201)', async () => {
        if (!serviceId) {
            console.warn('[Integration] Skipped Step 1: TEST_SERVICE_ID not set');
            return;
        }

        const res = await agent
            .post('/api/v1/payment-link')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId,
                amount: 50000,
                currency: 'INR',
                callback_url: 'https://example.com/payment/callback',
                description: 'Integration test payment link',
                customer: {
                    name: 'Integration Test Customer',
                    email: 'customer@integration.test',
                    contact: '9999999999',
                },
            });

        if (!res.ok) console.error('[Integration] Step 1 response:', res.body);

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toBeDefined();
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.url).toBeDefined();
        expect(typeof res.body.data.url).toBe('string');

        console.log(`[Integration] Payment Link created: id=${res.body.data.id}`);
    });

    // ─── Step 2: Create Invoice ────────────────────────────────────────────────

    it('Step 2 — POST /api/v1/invoice creates an invoice with a payment link (201)', async () => {
        if (!serviceId || !clientId) {
            console.warn('[Integration] Skipped Step 2: TEST_SERVICE_ID or TEST_CLIENT_ID not set');
            return;
        }

        const res = await agent
            .post('/api/v1/invoice')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                invoiceNumber: `INV-INTEGRATION-${Date.now()}`,
                title: 'Integration Test Invoice',
                description: 'Invoice generated during integration test run',
                clientId,
                amountMinor: 50000,
                currency: 'INR',
                serviceId,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });

        if (!res.ok) console.error('[Integration] Step 2 response:', res.body);

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.payload).toBeDefined();
        expect(res.body.payload.invoice).toBeDefined();
        expect(res.body.payload.paymentLink).toBeDefined();
        expect(res.body.payload.invoice.id).toBeDefined();
        expect(res.body.payload.paymentLink.url).toBeDefined();

        createdInvoiceId = res.body.payload.invoice.id;
        console.log(`[Integration] Invoice created: id=${createdInvoiceId}`);
    });

    // ─── Step 3: Register a Webhook endpoint ──────────────────────────────────

    it('Step 3 — POST /api/v1/webhook registers a webhook endpoint (201)', async () => {
        if (!serviceId) {
            console.warn('[Integration] Skipped Step 3: TEST_SERVICE_ID not set');
            return;
        }

        const res = await agent
            .post('/api/v1/webhook')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                serviceId,
                url: 'https://example.com/webhook/integration-test',
                events: ['payment.captured', 'payment.failed'],
                secret: 'integration_test_secret',
                alert_email: 'dev@example.com',
            });

        if (!res.ok) console.error('[Integration] Step 3 response:', res.body);

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toBeDefined();
        expect(res.body.data.id).toBeDefined();

        createdWebhookId = res.body.data.id;
        console.log(`[Integration] Webhook registered: id=${createdWebhookId}`);
    });

    // ─── Step 4: Verify Invoice ─────────────────────────────────────────────────

    it('Step 4 — GET /api/v1/invoice/:id returns the created invoice (200)', async () => {
        if (!createdInvoiceId) {
            console.warn('[Integration] Skipped Step 4: no invoice created in Step 2');
            return;
        }

        const res = await agent
            .get(`/api/v1/invoice/${createdInvoiceId}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.payload.id).toBe(createdInvoiceId);
        expect(res.body.payload.status).toBe('pending');
    });

    // ─── Step 5: Verify Webhook ─────────────────────────────────────────────────

    it('Step 5 — GET /api/v1/webhook/:webhookId returns the created webhook (200)', async () => {
        if (!serviceId || !createdWebhookId) {
            console.warn('[Integration] Skipped Step 5: no webhook created in Step 3');
            return;
        }

        const res = await agent
            .get(`/api/v1/webhook/${createdWebhookId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ serviceId });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.id).toBe(createdWebhookId);
    });
});
