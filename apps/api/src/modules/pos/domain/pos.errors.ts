import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 400 — the amount tendered is less than the total due. */
export class InsufficientPaymentError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message = 'Amount tendered is less than the total due.') {
    super(message);
  }
}

/** 409 — not enough stock at the selling location to complete the sale (retail never oversells). */
export class InsufficientStockForSaleError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'Not enough stock at this location to complete the sale.') {
    super(message);
  }
}
