import type { Courier } from "@trycourier/courier";

export interface InvoiceNotificationData {
  clientName: string;
  invoiceNumber: string;
  amount: number | string;
  currency: string;
  dueDate?: string | Date | null;
  paymentUrl?: string;
}

/**
 * Generates standard Courier Elemental content for an invoice notification email.
 */
export const buildInvoiceNotificationContent = (
  data: InvoiceNotificationData,
): Courier.ElementalContent => {
  let formattedDueDate = "N/A";
  if (data.dueDate instanceof Date) {
    formattedDueDate = data.dueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else if (data.dueDate) {
    formattedDueDate = String(data.dueDate);
  }

  const elements: Courier.ElementalNodeNonChannel[] = [
    {
      type: "meta",
      title: `Invoice ${data.invoiceNumber}`,
    },
    {
      type: "text",
      text_style: "h1",
      content: "Invoice Notification",
      align: "left",
    },
    {
      type: "text",
      content: `Hello ${data.clientName},\n\nYou have received a new invoice (**${data.invoiceNumber}**) for **${data.currency} ${data.amount}**.\n\n**Due Date:** ${formattedDueDate}`,
      format: "markdown",
      align: "left",
    },
  ];

  if (data.paymentUrl) {
    elements.push({
      type: "action",
      content: "Pay Invoice Now",
      href: data.paymentUrl,
      style: "button",
      align: "left",
    });
  }

  elements.push({
    type: "divider",
  });

  elements.push({
    type: "text",
    content: "Thank you for your business!",
    text_style: "subtext",
    align: "left",
  });

  return {
    version: "2022-01-01",
    elements: [
      {
        type: "channel",
        channel: "email",
        elements,
      },
    ],
  };
};
