import { describe, it, expect } from 'vitest';
import { ApiError, errorMessage, toApiError } from './api-error';

describe('toApiError', () => {
  it('parses the standard error envelope', () => {
    const error = toApiError(409, {
      error: { code: 'CONFLICT', message: 'SKU already exists', requestId: 'req-1' },
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
    expect(error.requestId).toBe('req-1');
  });

  it('exposes field-level validation details', () => {
    const error = toApiError(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid',
        details: [
          { field: 'name', message: 'Required' },
          { field: 'variants.0.sku', message: 'Invalid SKU' },
        ],
      },
    });
    expect(error.isValidation).toBe(true);
    expect(error.fieldErrors()).toEqual({ name: 'Required', 'variants.0.sku': 'Invalid SKU' });
  });

  it('falls back to INTERNAL_ERROR for non-envelope bodies', () => {
    const error = toApiError(500, 'gateway exploded');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.status).toBe(500);
    expect(error.details).toEqual([]);
  });
});

describe('errorMessage', () => {
  it('uses an ApiError message', () => {
    const error = new ApiError({ code: 'NOT_FOUND', message: 'Not here', status: 404 });
    expect(errorMessage(error)).toBe('Not here');
  });

  it('handles unknown thrown values', () => {
    expect(errorMessage(42)).toMatch(/wrong/i);
  });
});
