import app from '../src/app';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Webhook API route tests
// Requires: TEST_SERVICE_ID env vars for live tests.

describe('Webhook API — /api/v1/webhook', () => {
  const agent = request.agent(app);
  const serviceId = process.env.TEST_SERVICE_ID ?? '';
  let createdWebhookId: string;
  let accessToken: string;
  let userId: string;

  const temp_user = {
    email: "temp-webhook-user@example.com",
    name: "Webhook-TestUser",
    password: "Password.@123",
    role: "user",
  };

  beforeAll(async () => {
    // create temp user
    await agent
      .post("/api/v1/user/register")
      .type("form")
      .send({
        ...temp_user,
        passwordHash: temp_user.password,
      });

    // logging in
    const login_res = await agent
      .post("/api/v1/auth/login")
      .type("form")
      .send({ email: temp_user.email, password: temp_user.password });

    if (!login_res.ok) {
      console.error(login_res.body);
      throw new Error("Temp user login failed !");
    }

    accessToken = login_res.body.accessToken as string;
    userId = login_res.body.user.id as string;
  });

  afterAll(async () => {
    //logout
    await agent.post("/api/v1/auth/logout");
    // del user
    await agent
      .delete(`/api/v1/user/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  });

  // ─── Auth guard ─────────────────────────────────────────────────────────────

  it('POST / returns 401 when Authorization header is missing', async () => {
    const res = await agent.post('/api/v1/webhook').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('failed');
  });

  it('GET /:webhookId returns 401 when Authorization header is missing', async () => {
    const res = await agent.get('/api/v1/webhook/fake-webhook-id');
    expect(res.statusCode).toBe(401);
  });

  // ─── Validation — POST / ────────────────────────────────────────────────────

  it('POST / returns 400 when body is empty', async () => {
    const res = await agent
      .post('/api/v1/webhook')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
    expect(res.body.error).toBeDefined();
  });

  it('POST / returns 400 when serviceId is missing', async () => {
    const res = await agent
      .post('/api/v1/webhook')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'http://localhost:3000/wh', events: ['payment.captured'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('POST / returns 400 when url is not a valid URL', async () => {
    const res = await agent
      .post('/api/v1/webhook')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ serviceId, url: 'not-a-url', events: ['payment.captured'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('POST / returns 400 when events array is empty', async () => {
    const res = await agent
      .post('/api/v1/webhook')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ serviceId, url: 'http://localhost:3000/wh', events: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  // ─── Validation — PATCH /:webhookId ─────────────────────────────────────────

  it('PATCH /:webhookId returns 400 when serviceId is missing', async () => {
    const res = await agent
      .patch('/api/v1/webhook/some-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ url: 'http://localhost:3000/updated' });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  // ─── Happy path (requires live credentials) ──────────────────────────────────

  it('POST / creates a webhook and returns 201', async () => {
    if (!serviceId) {
      console.warn('[Skipped] TEST_SERVICE_ID not set');
      return;
    }

    const res = await agent
      .post('/api/v1/webhook')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        url: 'https://593tpgg3-3001.inc1.devtunnels.ms/api/v1/webhook/test',
        events: ['payment.captured', 'payment.failed'],
        secret: 'test_secret_123',
        alert_email: 'alerts@example.com',
      });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.url).toBeDefined();
    expect(res.body.data.active).toBeDefined();
    expect(res.body.data.provider).toBeDefined();
    expect(Array.isArray(res.body.data.events)).toBe(true);

    createdWebhookId = res.body.data.id;
  });

  it('GET /:webhookId returns 200 and webhook details', async () => {
    if (!serviceId || !createdWebhookId) {
      console.warn('[Skipped] Missing credentials or no webhook created');
      return;
    }

    const res = await agent
      .get(`/api/v1/webhook/${createdWebhookId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ serviceId });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe(createdWebhookId);
  });

  it('PATCH /:webhookId returns 200 and updated webhook', async () => {
    if (!serviceId || !createdWebhookId) {
      console.warn('[Skipped] Missing credentials or no webhook created');
      return;
    }

    const res = await agent
      .patch(`/api/v1/webhook/${createdWebhookId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        url: 'http://localhost:3000/updated-webhook',
        events: ['payment.captured', 'order.paid'],
      });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.url).toBe('http://localhost:3000/updated-webhook');
  });

  it('DELETE /:webhookId returns 200 and deleted: true', async () => {
    if (!serviceId || !createdWebhookId) {
      console.warn('[Skipped] Missing credentials or no webhook created');
      return;
    }

    const res = await agent
      .delete(`/api/v1/webhook/${createdWebhookId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ serviceId });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.deleted).toBe(true);
  });

  it('GET /:webhookId returns 404 after deletion', async () => {
    if (!serviceId || !createdWebhookId) {
      console.warn('[Skipped] Missing credentials or no webhook created');
      return;
    }

    const res = await agent
      .get(`/api/v1/webhook/${createdWebhookId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ serviceId });

    // Razorpay may return 404 or 400 for a deleted/deactivated webhook
    expect([400, 404]).toContain(res.statusCode);
    expect(res.body.status).toBe('failed');
  });
});
