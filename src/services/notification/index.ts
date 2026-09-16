import nodemailer from "nodemailer";
import logger from "@services/logging/logging.service";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import dotenv from "dotenv";

dotenv.config();

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  body: string,
) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: "abhiramajithr@gmail.com",
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  } as SMTPTransport.Options);

  const senderEmail = "abhiramajithr@gmail.com";

  try {
    await transport.verify();
    logger.info("Mailer transport is ready !");
  } catch (err) {
    console.error(err);
    logger.error(err);
  }
  try {
    return transport.sendMail({
      from: senderEmail,
      to,
      subject,
      text: body, // or html: body
    });
  } catch (err) {
    console.error(err);
  }
};
