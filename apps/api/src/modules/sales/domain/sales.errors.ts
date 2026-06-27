import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 422 — the SO references a customer that isn't live in this tenant. */
export class InvalidCustomerError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(customerId: string) {
    super(`Customer "${customerId}" does not exist.`, [
      { field: 'customerId', message: 'Customer does not exist in this organization' },
    ]);
  }
}

/** 422 — the SO references a warehouse that isn't live in this tenant. */
export class InvalidSalesWarehouseError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(warehouseId: string) {
    super(`Warehouse "${warehouseId}" does not exist.`, [
      { field: 'warehouseId', message: 'Warehouse does not exist in this organization' },
    ]);
  }
}

/** 422 — a line references a variant that isn't live in this tenant. */
export class InvalidSalesLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(variantId: string) {
    super(`Variant "${variantId}" does not exist.`, [
      { field: 'lines', message: `Variant "${variantId}" does not exist in this organization` },
    ]);
  }
}

/** 422 — the fulfilment location is missing or not in the SO's fulfilment warehouse. */
export class InvalidFulfillLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'locationId', message }]);
  }
}

/** 422 — a fulfil request references a line that isn't on the SO. */
export class UnknownSalesLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(lineId: string) {
    super(`Line "${lineId}" is not on this sales order.`, [
      { field: 'lines', message: `Unknown line "${lineId}"` },
    ]);
  }
}

/** 409 — the requested transition isn't allowed from the SO's current status. */
export class SalesOrderStateError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message, [{ field: 'status', message }]);
  }
}

/** 409 — fulfilling more than the outstanding quantity on a line. */
export class OverFulfillError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(lineId: string, outstanding: number) {
    super(`Cannot fulfil more than the ${outstanding} outstanding on line "${lineId}".`, [
      { field: 'quantity', message: `Exceeds the ${outstanding} outstanding` },
    ]);
  }
}
