import { ErrorCode, ProviderName } from './types/enums';

export class PaymentError extends Error {
  constructor(
    public code: ErrorCode,
    override message: string,
    public provider: ProviderName,
    public providerErrorCode?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends PaymentError {
  constructor(public field: string, message: string, provider: ProviderName) {
    super(ErrorCode.INVALID_REQUEST, message, provider);
    this.name = 'ValidationError';
  }
}
