import express from 'express';
import path from 'path';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import companyRouter from './routes/company.route';
import companyServiceRouter from './routes/company-service.route';
import providerRouter from './routes/provider.route';
import TransactionRouter from './routes/transactions.route';
import webhookRouter from './routes/webhook.route';
import InvoiceRouter from './routes/invoice.route';
import ClientRouter from './routes/client.route';
import cookieParser from 'cookie-parser';

import cors from 'cors';

const app = express();

// some default middlewars
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// v1 routes
const appV1 = express.Router();
appV1.use('/auth', authRouter);
appV1.use('/user', userRouter);
appV1.use('/company', companyRouter);
appV1.use('/service', companyServiceRouter);
appV1.use('/provider', providerRouter);
appV1.use('/transaction', TransactionRouter);
appV1.use('/webhook', webhookRouter);
appV1.use('/invoice', InvoiceRouter);
appV1.use('/client', ClientRouter);


app.use('/api/v1', appV1);

// Generic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'failed', error: errMsg });
});

//health check 
app.get('/', (req, res) => res.status(200).send("Server is running !"))
app.get('/api/v1/health', (req,res) => res.status(200).send("Server api-v1 is running !"))

export default app;