/**
 * webhook-receive.test.ts
 *
 * Unit tests for the public webhook receive endpoint:
 *   POST /api/v1/webhook/:secret
 *
 * This endpoint accepts raw payloads from Stripe / Razorpay and verifies
 * signatures. The tests cover:
 *   - 400 for unknown endpoint tokens
 *   - 400 for invalid/missing signatures
 *   - 200 for valid (mocked) Razorpay events
 *   - 200 / ignored for unrecognised event types
 */
import app from '../src/app';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Computes a Razorpay-compatible HMAC-SHA256 signature for a raw payload.
 */
function razorpaySignature(rawBody: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Webhook Receive — POST /api/v1/webhook/:secret', () => {
    const baseUrl = '/api/v1/webhook/receive';

    // ─── Unknown endpoint token ────────────────────────────────────────────

    it('returns 400 for an unknown endpoint token', async () => {
        const res = await request(app)
            .post(`${baseUrl}/completely-unknown-token-xyz`)
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ event: 'payment.captured' }));

        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('failed');
        expect(res.body.error).toMatch(/unknown webhook endpoint/i);
    });

    // ─── Missing / invalid signature ──────────────────────────────────────

    it('returns 400 when signature header is absent (known token required)', async () => {
        const endpointToken = process.env.TEST_WEBHOOK_TOKEN;
        if (!endpointToken) {
            console.warn('[Skipped] TEST_WEBHOOK_TOKEN not set');
            return;
        }

        const body = JSON.stringify({ event: 'payment_link.paid' });

        const res = await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .send(Buffer.from(body));

        // No signature header → should fail verification
        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('failed');
        expect(res.body.error).toMatch(/signature/i);
    });

    it('returns 400 when signature is wrong (known Razorpay token required)', async () => {
        const endpointToken = process.env.TEST_WEBHOOK_TOKEN;
        if (!endpointToken) {
            console.warn('[Skipped] TEST_WEBHOOK_TOKEN not set');
            return;
        }

        const body = JSON.stringify({ event: 'payment_link.paid' });

        const res = await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .set('x-razorpay-signature', 'bad_signature_value')
            .send(Buffer.from(body));

        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('failed');
        expect(res.body.error).toMatch(/signature/i);
    });

    // ─── Valid Razorpay payment_link.paid event ────────────────────────────

    it('returns 200 for a valid Razorpay payment_link.paid event', async () => {
        const endpointToken  = process.env.TEST_WEBHOOK_TOKEN;
        const signingSecret  = process.env.TEST_WEBHOOK_SECRET;

        if (!endpointToken || !signingSecret) {
            console.warn('[Skipped] TEST_WEBHOOK_TOKEN or TEST_WEBHOOK_SECRET not set');
            return;
        }

        const razorpayBody = {
            event: 'payment_link.paid',
            payload: {
                payment_link: {
                    entity: {
                        id: 'plink_test_integration_001',
                        status: 'paid',
                    },
                },
                payment: {
                    entity: {
                        id: 'pay_test_001',
                    },
                },
            },
        };

        const rawBody = JSON.stringify(razorpayBody);
        const sig = razorpaySignature(rawBody, signingSecret);

        const res = await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .set('x-razorpay-signature', sig)
            .send(Buffer.from(rawBody));

        if (!res.ok) console.error('[Test] Response:', res.body);

        // Either processed (200) or ignored — both are acceptable acknowledgements
        expect([200]).toContain(res.statusCode);
        expect(['success', 'ignored']).toContain(res.body.status);
    });

    // ─── Unrecognised event type ───────────────────────────────────────────

    it('returns 200 with status=ignored for an unrecognised event type', async () => {
        const endpointToken  = process.env.TEST_WEBHOOK_TOKEN;
        const signingSecret  = process.env.TEST_WEBHOOK_SECRET;

        if (!endpointToken || !signingSecret) {
            console.warn('[Skipped] TEST_WEBHOOK_TOKEN or TEST_WEBHOOK_SECRET not set');
            return;
        }

        const razorpayBody = {
            event: 'subscription.activated',   // event our code does not handle
            payload: {},
        };

        const rawBody = JSON.stringify(razorpayBody);
        const sig = razorpaySignature(rawBody, signingSecret);

        const res = await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .set('x-razorpay-signature', sig)
            .send(Buffer.from(rawBody));

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ignored');
    });

    // ─── Duplicate event (idempotency) ─────────────────────────────────────

    it('returns 200 with status=ignored when the same event is replayed', async () => {
        const endpointToken  = process.env.TEST_WEBHOOK_TOKEN;
        const signingSecret  = process.env.TEST_WEBHOOK_SECRET;

        if (!endpointToken || !signingSecret) {
            console.warn('[Skipped] TEST_WEBHOOK_TOKEN or TEST_WEBHOOK_SECRET not set');
            return;
        }

        const razorpayBody = {
            event: 'payment_link.paid',
            payload: {
                payment_link: {
                    entity: { id: 'plink_idempotency_test', status: 'paid' },
                },
                payment: {
                    entity: { id: 'pay_idempotency_test' },
                },
            },
        };

        const rawBody = JSON.stringify(razorpayBody);
        const sig = razorpaySignature(rawBody, signingSecret);

        // First call — should succeed or ignore
        await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .set('x-razorpay-signature', sig)
            .send(Buffer.from(rawBody));

        // Second call (same providerEventId) — must be idempotent
        const res = await request(app)
            .post(`${baseUrl}/${endpointToken}`)
            .set('Content-Type', 'application/octet-stream')
            .set('x-razorpay-signature', sig)
            .send(Buffer.from(rawBody));

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ignored');
    });
});
