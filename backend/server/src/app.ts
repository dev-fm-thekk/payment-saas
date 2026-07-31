import express from 'express';
import path from 'path';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import companyRouter from './routes/company.route';
import companyServiceRouter from './routes/company-service.route';
import providerRouter from './routes/provider.route';
import TransactionRouter from './routes/transactions.route';
import webhookRouter from './routes/webhook.route';
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
app.use('/transaction', TransactionRouter);
app.use('/webhook', webhookRouter);

// Generic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'failed', error: errMsg });
});

app.get('/', (_req, res) => res.send('hi welcome to payment gateway'));

app.listen(3001, () => console.log('Server running on port 3001'));