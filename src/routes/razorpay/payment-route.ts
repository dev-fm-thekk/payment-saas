import express from 'express';
import { PaymentCaptureSchema, validateSchema } from '../../utils/validate';
import { paymentClient } from '../../sdk';

const PaymentRouter = express.Router();

PaymentRouter.post('/capture', async (req, res) => {
    const { error, data } = validateSchema(PaymentCaptureSchema, req.body);
    if (error) return res.status(400).send({ error });

    try {
        const { payment_id, amount, currency } = data;
        const response = await paymentClient.capturePayment(payment_id, amount, currency);
        return res.status(200).send(response);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ err });
    }
});

export default PaymentRouter;
