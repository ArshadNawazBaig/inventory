import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 422 — the stock movement targets a variant that isn't live in this tenant. */
export class InvalidVariantError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(variantId: string) {
    super(`Variant "${variantId}" does not exist.`, [
      { field: 'variantId', message: 'Variant does not exist in this organization' },
    ]);
  }
}

/** 422 — the stock movement targets a location that isn't live in this tenant. */
export class InvalidStockLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(locationId: string) {
    super(`Location "${locationId}" does not exist.`, [
      { field: 'locationId', message: 'Location does not exist in this organization' },
    ]);
  }
}

/** 400 — a zero delta moves nothing. */
export class ZeroDeltaError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
  constructor() {
    super('Adjustment delta must be non-zero.', [{ field: 'delta', message: 'Must be non-zero' }]);
  }
}

/** 409 — the movement would drive on-hand negative and the tenant disallows negative stock. */
export class InsufficientStockError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(available: number, requested: number) {
    super(
      `Insufficient stock: on-hand ${available}, requested change ${requested} would go negative.`,
      [{ field: 'delta', message: 'Would drive on-hand negative' }],
    );
  }
}
