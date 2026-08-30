import nodemailer from 'nodemailer';
import vars from '../../../configs/config';
import logger from '../logging/logging.service';

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'abhiramajithr@gmail.com',
        pass: vars.GOOGLE_APP_PASSWORD
    }
})

const senderEmail = "abhiramajithr@gmail.com";

try {
    await transport.verify();
    logger.info("Mailer transport is ready !");
} catch(err) {
    logger.error(err);
}

export const sendNotificationEmail = async (to: string, subject: string, body: string) => {
    return transport.sendMail({
        from: senderEmail,
        to,
        subject,
        text: body, // or html: body
    });
};