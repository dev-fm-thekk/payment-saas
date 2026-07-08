import express from 'express';
import { PlanRequestSchema, validateSchema } from '../../utils/validate';
import { paymentClient } from '../../sdk';

const PlanRouter = express.Router();

PlanRouter.post('/create', async (req, res) => {
    const { error, data } = validateSchema(PlanRequestSchema, req.body);
    if (error) return res.status(400).send({ error });

    try {
        const response = await paymentClient.createPlan(data);
        return res.status(201).send(response);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ err });
    }
});

export default PlanRouter;
