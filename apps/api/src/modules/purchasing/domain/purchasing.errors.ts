import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 422 — the PO references a supplier that isn't live in this tenant. */
export class InvalidSupplierError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(supplierId: string) {
    super(`Supplier "${supplierId}" does not exist.`, [
      { field: 'supplierId', message: 'Supplier does not exist in this organization' },
    ]);
  }
}

/** 422 — the PO references a warehouse that isn't live in this tenant. */
export class InvalidPurchaseWarehouseError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(warehouseId: string) {
    super(`Warehouse "${warehouseId}" does not exist.`, [
      { field: 'warehouseId', message: 'Warehouse does not exist in this organization' },
    ]);
  }
}

/** 422 — a line references a variant that isn't live in this tenant. */
export class InvalidPurchaseLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(variantId: string) {
    super(`Variant "${variantId}" does not exist.`, [
      { field: 'lines', message: `Variant "${variantId}" does not exist in this organization` },
    ]);
  }
}

/** 422 — the receive location is missing or not in the PO's receiving warehouse. */
export class InvalidReceiveLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'locationId', message }]);
  }
}

/** 422 — a receive request references a line that isn't on the PO. */
export class UnknownPurchaseLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(lineId: string) {
    super(`Line "${lineId}" is not on this purchase order.`, [
      { field: 'lines', message: `Unknown line "${lineId}"` },
    ]);
  }
}

/** 409 — the requested transition isn't allowed from the PO's current status. */
export class PurchaseOrderStateError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message, [{ field: 'status', message }]);
  }
}

/** 409 — receiving more than the outstanding quantity on a line. */
export class OverReceiveError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(lineId: string, outstanding: number) {
    super(`Cannot receive more than the ${outstanding} outstanding on line "${lineId}".`, [
      { field: 'quantity', message: `Exceeds the ${outstanding} outstanding` },
    ]);
  }
}
