import { Courier } from "@trycourier/courier";
import logger from "@services/logging/logging.service";
import dotenv from "dotenv";
import {
  buildInvoiceNotificationContent,
  type InvoiceNotificationData,
} from "./templates";

dotenv.config();

// Reads process.env.COURIER_API_KEY by default
const courier = new Courier({
  apiKey: process.env.COURIER_API_KEY,
});

/**
 * Sends a generic notification email using Courier.
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  body: string,
  idempotencyKey?: string,
) => {
  try {
    const response = await courier.send.message({
      message: {
        to: { email: to },
        content: {
          title: subject,
          body: body,
        },
      },
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    });

    logger.info(`Courier notification email sent successfully. RequestId: ${response.requestId}`);
    return response;
  } catch (err) {
    console.error("Error sending notification via Courier:", err);
    logger.error(`Error sending notification via Courier: ${err}`);
    throw err;
  }
};

/**
 * Sends a structured invoice notification using Courier.
 * Uses a stored template if COURIER_INVOICE_TEMPLATE_ID is provided,
 * otherwise defaults to the standard invoice Elemental template.
 */
export const sendInvoiceNotification = async (
  to: string,
  data: InvoiceNotificationData,
  idempotencyKey?: string,
) => {
  try {
    const templateId = process.env.COURIER_INVOICE_TEMPLATE_ID;

    const messagePayload: any = {
      to: { email: to },
      data: {
        clientName: data.clientName,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        dueDate: String(data.dueDate),
        paymentUrl: data.paymentUrl || "",
      },
    };

    if (templateId) {
      messagePayload.template = templateId;
    } else {
      messagePayload.content = buildInvoiceNotificationContent(data);
    }

    const response = await courier.send.message({
      message: messagePayload,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    });

    logger.info(`Courier invoice notification sent successfully. RequestId: ${response.requestId}`);
    return response;
  } catch (err) {
    console.error("Error sending invoice notification via Courier:", err);
    logger.error(`Error sending invoice notification via Courier: ${err}`);
    throw err;
  }
};

export { courier };
