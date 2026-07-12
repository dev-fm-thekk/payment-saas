import { describe, it, expect } from 'vitest';
import { PaymentError, ValidationError } from '../../src/errors';
import { ErrorCode, ProviderName } from '../../src/types/enums';

describe('Errors', () => {
  describe('PaymentError', () => {
    it('constructs correctly', () => {
      const error = new PaymentError(
        ErrorCode.PROVIDER_ERROR,
        'Test error message',
        ProviderName.STRIPE,
        'card_declined',
        true
      );
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PaymentError');
      expect(error.code).toBe(ErrorCode.PROVIDER_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.provider).toBe(ProviderName.STRIPE);
      expect(error.providerErrorCode).toBe('card_declined');
      expect(error.retryable).toBe(true);
    });

    it('defaults retryable to false', () => {
      const error = new PaymentError(
        ErrorCode.PROVIDER_ERROR,
        'Test error message',
        ProviderName.STRIPE
      );
      
      expect(error.retryable).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('constructs correctly', () => {
      const error = new ValidationError(
        'amount',
        'Amount must be positive',
        ProviderName.RAZORPAY
      );
      
      expect(error).toBeInstanceOf(PaymentError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(error.message).toBe('Amount must be positive');
      expect(error.provider).toBe(ProviderName.RAZORPAY);
      expect(error.field).toBe('amount');
      expect(error.retryable).toBe(false);
    });
  });
});
