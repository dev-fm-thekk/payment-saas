import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
    ListTransactionsRequestSchema,
    validateSchema,
} from '../../../utils/schema';
import { fetchTransaction, listTransactions } from './transactions.helper';


export const listTransactionController = async (req: ApiKeyRequest,  res: any,  next: any) => {
    const serviceId: string = req.params.serviceId as string;
    const companyId: string = req.params.companyId as string;

    try {
        const { error: zodError, data } = validateSchema(ListTransactionsRequestSchema, req.query);
        if (zodError) {
            res.status(400).json({
                status: 'failed',
                error: zodError.issues
                    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
                    .join(', '),
            });
            return;
        }

        data.serviceId = serviceId;

        const result = await listTransactions(data, companyId);
        if (result.status === 'failed') {
            res.status(400).json(result);
            return;
        }

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

export const fetchTransactionController = async (req: ApiKeyRequest,  res: any,  next: any) => {
    const companyId: string = req.params.companyId as string;
    const serviceId: string = req.params.serviceIs as string;
    const transactionId: string = req.params.id as string;

    const fields = req.query.fields;

    const input = {
        companyId: companyId as string,
        serviceId: serviceId as string,
        transactionId,
        fields
    }

    try {
        const { error, data, status} = await fetchTransaction(input);
        
        if (status == "failed") {
            res.status(400).json({
                data,
                error,
                status,
            })
        }
        return res.status(200).json({
            data,
            status,
            error
        });
    }  catch(err) {
        next(err);
    }
};
