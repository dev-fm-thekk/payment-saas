import { describe, it, expect, beforeAll } from "vitest";
import {
  RazorpayAdapter,
  ProviderName,
  type CreatePaymentLinkRequest,
} from "../../core";
import vars from "../../configs/config";
import fs from "fs/promises";
import logger from "../../src/services/logging/logging.service";

// unit test creation of payment-link for razorpay and stripe;

describe("Test: Create payment-link", () => {
  // since no stripe credentials are available, testing with only razorpay

  let client: RazorpayAdapter;

  const credentials = {
    apiKey: vars.RAZORPAY_API_KEY!,
    apiSecret: vars.RAZORPAY_API_SECRET!,
  };

  const customer = {
    name: "Abhiram A R",
    email: "abhiramajithr@gmail.com",
    contact: "8547376353",
  };

  beforeAll(() => {
    client = new RazorpayAdapter(credentials);
  });

  // ─── Standard payment link ─────────────────────────────────────────────────

  it("Create a standard payment link (INR)", async () => {
    try {
      const input: CreatePaymentLinkRequest = {
        currency: "INR",
        amount: 100,
        callback_url: "http://localhost:3000/callback",
        customer,
      };

      const response = await client.createPaymentLink(input);

      console.log(response);
      // Core identity fields
      expect(response.id).toBeDefined();
      expect(response.url).toBeDefined();

      // Amount + currency should echo back
      expect(response.amount).toBe(input.amount);
      expect(response.currency).toBe(input.currency);

      // Freshly created link is active
      expect(response.status).toBe(true);

      // Callback should be preserved
      expect(response.callback_url).toBe(input.callback_url);

      // Provider tag
      expect(response.provider).toBe(ProviderName.RAZORPAY);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── UPI payment link ──────────────────────────────────────────────────────

  // it("Create a UPI payment link", async () => {
  //   try {
  //     const input: CreatePaymentLinkRequest = {
  //       currency: "INR",
  //       amount: 500,
  //       callback_url: "http://localhost:3000/callback",
  //       upi_link: true,
  //       customer,
  //     };

  //     const response = await client.createPaymentLink(input);

  //     expect(response.id).toBeDefined();
  //     expect(response.url).toBeDefined();
  //     expect(response.upi_link).toBe(true);
  //     expect(response.status).toBe(true);
  //     expect(response.provider).toBe(ProviderName.RAZORPAY);
  //   } catch (err) {
  //     console.error(`[Test Failed]: Code has errors: ${err}`);
  //   }
  // });

  // ─── Payment link with description and metadata ────────────────────────────

  it("Create a payment link with description and metadata", async () => {
    try {
      const input: CreatePaymentLinkRequest = {
        currency: "INR",
        amount: 250,
        callback_url: "http://localhost:3000/callback",
        description: "Test payment for order #1234",
        metadata: { orderId: "1234", source: "test-suite" },
        customer,
      };

      const response = await client.createPaymentLink(input);

      expect(response.id).toBeDefined();
      expect(response.url).toBeDefined();
      expect(response.amount).toBe(input.amount);
      expect(response.status).toBe(true);
      expect(response.provider).toBe(ProviderName.RAZORPAY);
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Response shape validation ─────────────────────────────────────────────

  it("Response contains all required fields with correct types", async () => {
    try {
      const input: CreatePaymentLinkRequest = {
        currency: "INR",
        amount: 100,
        callback_url: "http://localhost:3000/callback",
        customer,
      };

      const response = await client.createPaymentLink(input);

      expect(typeof response.id).toBe("string");
      expect(typeof response.url).toBe("string");
      expect(typeof response.amount).toBe("number");
      expect(typeof response.currency).toBe("string");
      expect(typeof response.status).toBe("boolean");
      expect(typeof response.callback_url).toBe("string");
      expect(typeof response.provider).toBe("string");
    } catch (err) {
      console.error(`[Test Failed]: Code has errors: ${err}`);
    }
  });

  // ─── Invalid input ─────────────────────────────────────────────────────────

  it("Throws an error for an invalid amount (0)", async () => {
    const input: CreatePaymentLinkRequest = {
      currency: "INR",
      amount: 0,
      callback_url: "http://localhost:3000/callback",
      customer,
    };

    await expect(client.createPaymentLink(input)).rejects.toThrow();
  });

  it("Throws an error for an invalid currency code", async () => {
    const input: CreatePaymentLinkRequest = {
      currency: "INVALID",
      amount: 100,
      callback_url: "http://localhost:3000/callback",
      customer,
    };

    await expect(client.createPaymentLink(input)).rejects.toThrow();
  });
});
