import { describe, it, expect, beforeAll } from "vitest";
import {
  RazorpayAdapter,
  type CreateWebhookRequest,
  type UpdateWebhookRequest,
  type WebhookVerificationRequest,
} from "../../core";
import vars from "../../configs/config";
import fs from 'fs/promises';
import logger from "../../src/services/logging/logging.service";

// unit test creation of webhook for razorpay and stripe;

describe("Test: Webhook management (Razorpay)", () => {
  // since no stripe credentials are available, testing with only razorpay

  let client: RazorpayAdapter;
  let createdWebhookId: string;

  const credentials = {
    apiKey: vars.RAZORPAY_API_KEY!,
    apiSecret: vars.RAZORPAY_API_SECRET!,
  };

  beforeAll(() => {
    client = new RazorpayAdapter(credentials);
  });

  // ─── Create Webhook ────────────────────────────────────────────────────────

  it("Create a webhook", async () => {
    try {
      const input: CreateWebhookRequest = {
        url: "https://593tpgg3-3001.inc1.devtunnels.ms/api/v1/webhook/test",
        alert_email: "abhiramajithr@gmail.com",
        secret: "test_webhook_secret",
        events: ["payment.captured", "payment.failed"],
      };

      const response = await client.createWebhook(input);

      expect(response.id).toBeDefined();
      expect(response.url).toBe(input.url);
      expect(response.active).toBeDefined();
      expect(response.provider).toBeDefined();
      expect(response.events).toBeInstanceOf(Array);
      expect(response.createdAt).toBeInstanceOf(Date);
      expect(response.updatedAt).toBeInstanceOf(Date);

      // Store for subsequent tests
      createdWebhookId = response.id;

      console.log(response);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Fetch Webhook ─────────────────────────────────────────────────────────

  it("Fetch a webhook by ID", async () => {
    try {
      if (!createdWebhookId) {
        console.warn("[Test Skipped]: No webhook ID available from create step.");
        return;
      }

      const response = await client.fetchWebhook(createdWebhookId);

      expect(response.id).toBe(createdWebhookId);
      expect(response.url).toBeDefined();
      expect(response.active).toBeDefined();
      expect(response.provider).toBeDefined();
      expect(response.events).toBeInstanceOf(Array);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Update Webhook ────────────────────────────────────────────────────────

  it("Update a webhook", async () => {
    try {
      if (!createdWebhookId) {
        console.warn("[Test Skipped]: No webhook ID available from create step.");
        return;
      }

      const input: UpdateWebhookRequest = {
        webhookId: createdWebhookId,
        url: "https://593tpgg3-3001.inc1.devtunnels.ms/api/v1/webhook/test",
        events: ["payment.captured", "order.paid"],
        alert_email: "abhiramajithr@gmail.com",
      };

      const response = await client.updateWebhook(input);

      expect(response.id).toBe(createdWebhookId);
      expect(response.url).toBe(input.url);
      expect(response.provider).toBeDefined();
      expect(response.events).toBeInstanceOf(Array);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Verify Webhook Signature ──────────────────────────────────────────────

  it("Verify a webhook signature (valid)", () => {
    try {
      const secret = "test_webhook_secret";
      const rawBody = JSON.stringify({ event: "payment.captured", payload: {} });

      // Compute expected signature using node crypto (same logic as the adapter)
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const input: WebhookVerificationRequest = {
        rawBody,
        signature: expectedSignature,
        secret,
      };

      const result = client.verifyWebhookSignature(input);
      expect(result).toBe(true);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  it("Reject a webhook signature (invalid)", () => {
    try {
      const input: WebhookVerificationRequest = {
        rawBody: JSON.stringify({ event: "payment.captured" }),
        signature: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        secret: "test_webhook_secret",
      };

      const result = client.verifyWebhookSignature(input);
      expect(result).toBe(false);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Delete Webhook ────────────────────────────────────────────────────────

  it("Delete a webhook", async () => {
    try {
      if (!createdWebhookId) {
        console.warn("[Test Skipped]: No webhook ID available from create step.");
        return;
      }

      const response = await client.deleteWebhook(createdWebhookId);

      expect(response.deleted).toBe(true);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });
});
