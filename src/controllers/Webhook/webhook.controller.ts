import z from "zod";
import { createWebhook, handleWebhook } from "./webhook.helper";

const WebhookSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  provider: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

const CreateWebhookSchema = WebhookSchema.omit({
  id: true,
  url: true,
  createdAt: true,
});

export const createWebhookController = async (req: any, res: any) => {
  const { data, error } = CreateWebhookSchema.safeParse(req.body);

  if (error)
    return res.status(400).send({
      service: "webhook | create",
      status: "failed",
      error: error.message,
    });
  try {
    const response = await createWebhook(data);
    return res.status(201).send({
      status: "success",
      service: "webhook | create",
      data: response,
    });
  } catch (err) {
    return res.status(500).send({
      service: "webhook | create",
      status: "failed",
      error: err,
    });
  }
};

export const webhookHandler = async (req: any, res: any) => {
  // const { protocol, originalUrl} = req;
  // const host = req.get('host');

  // let webhookEndpoint = `${protocol}://${host}${originalUrl}`;

  let webhookEndpoint =
    "https://593tpgg3-3001.inc1.devtunnels.ms/api/v1/webhook/77a74585-dbe2-435f-8a09-59edd2215842/razorpay/ca0ea569ef0587df3a66a70cbc2a31d3";
    
  let input = {
    payload: req.body,
    received_at: new Date().toString(),
    webhookEndpoint,
  };
  try {
    console.log(`[Webhook] Received payload for endpoint: ${webhookEndpoint}`);
    const response = await handleWebhook(input);

    if (response === "WEBHOOK_ENDPOINT_NOT_FOUND") {
      console.error(
        `[Webhook] Error: Webhook endpoint not found for URL ${webhookEndpoint}`,
      );
      return res.status(404).send({
        service: "webhook | manager",
        status: "failed",
        error: "Webhook endpoint not found",
      });
    }

    return res.status(201).send(response);
  } catch (err) {
    console.error(`[Webhook] DB Insertion or Processing Error:`, err);
    return res.status(500).send({
      service: "webhook | manager",
      status: "failed",
      error: err instanceof Error ? err.message : err,
    });
  }
};
