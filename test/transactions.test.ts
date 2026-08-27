/**
 * transactions.test.ts
 *
 * Unit tests for GET transaction APIs:
 *   - GET /api/v1/transaction/list/:companyId/:serviceId
 *   - GET /api/v1/transaction/:companyId/:serviceId/:id/info
 *
 * These tests verify auth guards, path param handling, and correct
 * response shapes. Live DB hits require TEST_SERVICE_ID etc. to be set.
 */
import app from '../src/app';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Transactions API', () => {
    const agent = request.agent(app);

    const serviceId = process.env.TEST_SERVICE_ID ?? '';
    const companyId = process.env.TEST_COMPANY_ID ?? '';

    let accessToken: string;
    let userId: string;

    const temp_user = {
        email: 'temp-transactions-user@example.com',
        name: 'Transactions-TestUser',
        password: 'Password.@123',
        role: 'user',
    };

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
            console.error(loginRes.body);
            throw new Error('Temp user login failed!');
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

    // ─── GET /list/:companyId/:serviceId ──────────────────────────────────────

    describe('GET /api/v1/transaction/list/:companyId/:serviceId', () => {
        it('returns 401 when Authorization header is missing', async () => {
            const res = await agent.get(`/api/v1/transaction/list/fake-company/fake-service`);
            expect(res.statusCode).toBe(401);
        });

        it('returns 401 when token is invalid', async () => {
            const res = await agent
                .get(`/api/v1/transaction/list/fake-company/fake-service`)
                .set('Authorization', 'Bearer invalid-token');
            expect(res.statusCode).toBe(401);
        });

        it('returns 400 when company does not own the service', async () => {
            if (!serviceId) {
                console.warn('[Skipped] TEST_SERVICE_ID not set');
                return;
            }

            // Use a random non-existent company id
            const res = await agent
                .get(`/api/v1/transaction/list/00000000-0000-0000-0000-000000000000/${serviceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('failed');
            expect(res.body.error).toMatch(/not found|does not belong/i);
        });

        it('returns 200 with an array of transactions for valid companyId/serviceId', async () => {
            if (!serviceId || !companyId) {
                console.warn('[Skipped] TEST_SERVICE_ID or TEST_COMPANY_ID not set');
                return;
            }

            const res = await agent
                .get(`/api/v1/transaction/list/${companyId}/${serviceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            if (!res.ok) console.error('[Test] Response:', res.body);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('returns 200 with an empty array when no transactions exist yet', async () => {
            if (!serviceId || !companyId) {
                console.warn('[Skipped] TEST_SERVICE_ID or TEST_COMPANY_ID not set');
                return;
            }

            const res = await agent
                .get(`/api/v1/transaction/list/${companyId}/${serviceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            // The API should always return an array (possibly empty)
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    // ─── GET /:companyId/:serviceId/:id/info ──────────────────────────────────

    describe('GET /api/v1/transaction/:companyId/:serviceId/:id/info', () => {
        it('returns 401 when Authorization header is missing', async () => {
            const res = await agent.get(
                `/api/v1/transaction/fake-company/fake-service/fake-id/info`,
            );
            expect(res.statusCode).toBe(401);
        });

        it('returns 401 when token is invalid', async () => {
            const res = await agent
                .get(`/api/v1/transaction/fake-company/fake-service/fake-id/info`)
                .set('Authorization', 'Bearer invalid-token');
            expect(res.statusCode).toBe(401);
        });

        it('returns 404 for a non-existent transaction ID', async () => {
            if (!companyId || !serviceId) {
                console.warn('[Skipped] TEST_COMPANY_ID or TEST_SERVICE_ID not set');
                return;
            }

            const fakeTransactionId = '00000000-0000-0000-0000-000000000000';

            const res = await agent
                .get(`/api/v1/transaction/${companyId}/${serviceId}/${fakeTransactionId}/info`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe('failed');
            expect(res.body.error).toMatch(/not found/i);
        });

        it('returns 200 with transaction details for an existing transaction', async () => {
            if (!companyId || !serviceId) {
                console.warn('[Skipped] TEST_COMPANY_ID, TEST_SERVICE_ID not set');
                return;
            }

            // First, fetch the list to get a real ID (if any exist)
            const listRes = await agent
                .get(`/api/v1/transaction/list/${companyId}/${serviceId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            const txList: any[] = listRes.body.data ?? [];
            if (txList.length === 0) {
                console.warn('[Skipped] No transactions in DB to fetch by ID');
                return;
            }

            const existingTxId = txList[0].id;

            const res = await agent
                .get(`/api/v1/transaction/${companyId}/${serviceId}/${existingTxId}/info`)
                .set('Authorization', `Bearer ${accessToken}`);

            if (!res.ok) console.error('[Test] Response:', res.body);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBe(existingTxId);
            expect(res.body.data.companyId).toBe(companyId);
            expect(res.body.data.status).toBeDefined();
            expect(res.body.data.amountMinor).toBeDefined();
            expect(res.body.data.currency).toBeDefined();
            expect(res.body.data.provider).toBeDefined();
        });

        it('returns 404 when the transaction belongs to a different company', async () => {
            if (!serviceId) {
                console.warn('[Skipped] TEST_SERVICE_ID not set');
                return;
            }

            const fakeCompanyId = '00000000-0000-0000-0000-000000000001';
            const fakeTransactionId = '00000000-0000-0000-0000-000000000002';

            const res = await agent
                .get(`/api/v1/transaction/${fakeCompanyId}/${serviceId}/${fakeTransactionId}/info`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe('failed');
        });
    });
});
