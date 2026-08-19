import app from '../src/app';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Payment-link API route tests
// These tests require a configured service with a payment provider.

describe('Payment Link API — POST /api/v1/payment-link', () => {
  const agent = request.agent(app);
  const serviceId = process.env.TEST_SERVICE_ID ?? '';
  let accessToken: string;
  let userId: string;

  const temp_user = {
    email: "temp-payment-link-user@example.com",
    name: "PaymentLink-TestUser",
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

  it('returns 401 when Authorization header is missing', async () => {
    const res = await agent.post('/api/v1/payment-link').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('failed');
  });

  it('returns 401 when Authorization is invalid', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', 'Bearer invalid-token')
      .send({});
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('failed');
  });

  // ─── Validation ─────────────────────────────────────────────────────────────

  it('returns 400 when body is empty', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when serviceId is missing', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100, currency: 'INR', callback_url: 'http://localhost:3000/callback' });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('returns 400 when amount is not positive', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        amount: 0,
        currency: 'INR',
        callback_url: 'http://localhost:3000/callback',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('returns 400 when currency is not exactly 3 characters', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        amount: 100,
        currency: 'INVALID',
        callback_url: 'http://localhost:3000/callback',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('returns 400 when callback_url is not a valid URL', async () => {
    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        amount: 100,
        currency: 'INR',
        callback_url: 'not-a-url',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  // ─── Happy path (requires live credentials) ──────────────────────────────────

  it('returns 201 and a payment link on valid request', async () => {
    if (!serviceId) {
      console.warn('[Skipped] TEST_SERVICE_ID not set');
      return;
    }

    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        amount: 100,
        currency: 'INR',
        callback_url: 'http://localhost:3000/callback',
        description: 'Test payment link',
        customer: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
      });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.url).toBeDefined();
    expect(typeof res.body.data.url).toBe('string');
    expect(res.body.data.provider).toBeDefined();
  });

  it('returns 201 with UPI link flag set', async () => {
    if (!serviceId) {
      console.warn('[Skipped] TEST_SERVICE_ID not set');
      return;
    }

    const res = await agent
      .post('/api/v1/payment-link')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceId,
        amount: 500,
        currency: 'INR',
        callback_url: 'http://localhost:3000/callback',
        upi_link: true,
        customer: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
      });

    if (!res.ok) console.error('[Test] Response:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.upi_link).toBe(true);
  });
});
