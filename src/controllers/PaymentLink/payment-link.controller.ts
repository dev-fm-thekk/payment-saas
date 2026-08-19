import type { ApiKeyRequest } from '../../middlewares/apikey.middleware';
import { CreatePaymentLinkSchema, validateSchema } from '../../../utils/schema';
import { createPaymentLink } from './payment-link.helper';

export const createPaymentLinkController = async (req: ApiKeyRequest, res: any, next: any) => {
  try {
    const { error: zodError, data } = validateSchema(CreatePaymentLinkSchema, req.body);
    if (zodError) {
      res.status(400).json({
        status: 'failed',
        error: zodError.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      });
      return;
    }

    const result = await createPaymentLink(data, req.companyId!);
    if (result.status === 'failed') {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
