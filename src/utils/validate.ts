import { z } from "zod";

export const CurrencySchema = z.enum(["INR", "USD"]);

export const OrderRequestSchema = z.object({
  amount: z.number(),
  currency: CurrencySchema,
  receipt: z.string().optional(),
  partial_payment: z.boolean().optional(),
  notes: z.record(z.string(), z.string()).optional(),
});

export const OrderResponseSchema = z.object({
  id: z.string(),
  entity: z.string(),
  amount: z.union([z.string(), z.number()]),
  amount_paid: z.number(),
  amount_due: z.number(),
  receipt: z.string().optional(),
  offer_id: z.any().optional(),
  status: z.string(),
  attempts: z.number(),
  notes: z.record(z.string(), z.string()).optional(),
  created_at: z.number(),
});

export const OrderOptionsSchema = z.object({
  from: z.number().optional(),
  to: z.number().optional(),
  count: z.number().optional(),
  skip: z.number().optional(),
  authorized: z.boolean().optional(),
  receipt: z.string().optional(),
  expand: z.string().optional(),
});

export const PaymentCaptureSchema = z.object({
  payment_id: z.string(),
  amount: z.number(),
  currency: CurrencySchema,
});

export const PlanRequestSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number(),
  item: z.object({
    name: z.string(),
    amount: z.number(),
    currency: CurrencySchema,
    description: z.string().optional(),
  }),
  notes: z.record(z.string(), z.string()).optional(),
});

export const RefundRequestSchema = z.object({
  payment_id: z.string(),
  amount: z.number().optional(),
  speed: z.enum(["normal", "optimum"]).optional(),
  notes: z.record(z.string(), z.string()).optional(),
  receipt: z.string().optional(),
});

export function validateSchema(schema: z.ZodSchema<any>, input: any) {
    const result = schema.safeParse(input);

    if (!result.success) return { error: result.error, data: null };

    return { error: null, data: result.data };
}

export type Currency = z.infer<typeof CurrencySchema>;
export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderOptions = z.infer<typeof OrderOptionsSchema>;
export type PaymentCaptureRequest = z.infer<typeof PaymentCaptureSchema>;
export type PlanRequest = z.infer<typeof PlanRequestSchema>;
export type RefundRequest = z.infer<typeof RefundRequestSchema>;


