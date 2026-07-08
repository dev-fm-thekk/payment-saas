import express from 'express';
import { OrderRequestSchema, validateSchema } from '../../utils/validate';
import { paymentClient } from '../../sdk';

const OrderRouter = express.Router();

OrderRouter.post('/create', async (req, res) => {
    const { error, data } = validateSchema(OrderRequestSchema, req.body);
    if (error) return res.status(400).send({ error });
    try {
        const response = await paymentClient.pay({
            amount: data.amount,
            currency: data.currency,
            receipt: data.receipt,
            description: data.notes?.description,
            metadata: data.notes
        });

        console.log(response);
        return res.status(201).send(response);
    } catch(err) {
        console.error(err);
        return res.status(500).send({ err })
    }
}) 

export default OrderRouter;