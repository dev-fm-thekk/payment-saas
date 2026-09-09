import nodemailer from "nodemailer";
import vars from "../../../configs/config";
import logger from "../logging/logging.service";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: "abhiramajithr@gmail.com",
    pass: vars.GOOGLE_APP_PASSWORD,
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

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  body: string,
) => {
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
