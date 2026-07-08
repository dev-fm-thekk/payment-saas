import express from 'express';
import { RefundRequestSchema, validateSchema } from '../../utils/validate';
import { paymentClient } from '../../sdk';

const RefundRouter = express.Router();

RefundRouter.post('/create', async (req, res) => {
    const { error, data } = validateSchema(RefundRequestSchema, req.body);
    if (error) return res.status(400).send({ error });

    try {
        const { payment_id, amount, notes } = data;
        const response = await paymentClient.refund({
            transactionId: payment_id,
            amount: amount,
            metadata: notes
        });
        return res.status(201).send(response);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ err });
    }
});

export default RefundRouter;
