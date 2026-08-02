import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import {
    ListTransactionsRequestSchema,
    validateSchema,
} from '../../../utils/schema';
import { fetchTransaction, listTransactions } from './transactions.helper';


export const listTransactionController = async (req: ApiKeyRequest,  res: any,  next: any) => {
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

        const result = await listTransactions(data, req.companyId!);
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
    const { id } = req.params;
    const { companyId , serviceId, fields } = req.query;
    
    const attributes: Array<string> = (fields! as string).split(',');

    if (!companyId) return res.status(400).send('company id not provided');
    if (!serviceId) return res.status(400).send('service id not provided');

    const input = {
        companyId: companyId as string,
        serviceId: serviceId as string,
        transactionId: id?.toString()!,
        fields: attributes
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
