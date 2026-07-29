import express from 'express';
import path from 'path';
import authRouter from './routes/Auth/route';
import userRouter from './routes/User/route';
import companyRouter from './routes/Company/route';
import companyServiceRouter from './routes/CompanyService/route';
import providerRouter from './routes/Provider/route';
import paymentRouter from './routes/Payment/route';
import webhookRouter from './routes/Webhook/route';
import cors from 'cors';

const app = express();
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/company', companyRouter);
app.use('/service', companyServiceRouter);
app.use('/provider', providerRouter);
app.use('/payment', paymentRouter);
app.use('/webhook', webhookRouter);

// Generic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'failed', error: errMsg });
});

app.get('/', (_req, res) => res.send('hi welcome to payment gateway'));

app.listen(3001, () => console.log('Server running on port 3001'));