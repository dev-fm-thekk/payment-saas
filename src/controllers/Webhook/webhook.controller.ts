import z from "zod";
import {
  checkCompanyExists,
  checkProviderExists,
  createWebhook,
  fetchWebhookEndpoints,
  fetchWebhookEvents,
  handleWebhook,
} from "./webhook.helper";

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

  const host = req.get("host");
  const baseUrl = `${host}/api/v1`;
  try {
    const response = await createWebhook(data, baseUrl);
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
  const { protocol, originalUrl } = req;
  const host = req.get("host");

  let webhookEndpoint = `${protocol}://${host}${originalUrl}`;

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

export const getWebhookEndpoints = async (req: any, res: any) => {
  const { companyId, provider } = req.params;

  const companyExists = await checkCompanyExists(companyId);

  if (!companyExists)
    return res.status(400).send({
      service: "webhook | fetch",
      status: "failed",
      error: "company not found",
    });

  const providerExists = await checkProviderExists(provider);

  if (!providerExists)
    return res.status(400).send({
      service: "webhook | fetch",
      status: "failed",
      error: "provider not found",
    });

  try {
    const response = await fetchWebhookEndpoints(companyId, provider);
    return res.status(200).send(response);
  } catch (err) {
    console.error(`[Webhook] DB selection error ${err}`);
    return res.status(500).send({
      service: "webhook | fetch",
      status: "failed",
      error: err instanceof Error ? err.message : err,
    });
  }
};

export const getWebhookEventLogs = async (req: any, res: any) => {
  const { webhookEndpointId } = req.params;
  
  try {
    const response = await fetchWebhookEvents(webhookEndpointId);

    return res.status(200).send(response);
  } catch (err) {
    console.error(`[Webhook] DB selection error ${err}`);
    return res.status(500).send({
      service: "webhook | fetch",
      status: "failed",
      error: err instanceof Error ? err.message : err,
    });
  }
};
