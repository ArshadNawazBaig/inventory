import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 422 — the transfer references a source/destination location that isn't live in this tenant. */
export class InvalidTransferLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(field: 'sourceLocationId' | 'destinationLocationId', locationId: string) {
    super(`Location "${locationId}" does not exist.`, [
      { field, message: 'Location does not exist in this organization' },
    ]);
  }
}

/** 422 — source and destination are the same location (nothing to move). */
export class SameLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor() {
    super('Source and destination must be different locations.', [
      { field: 'destinationLocationId', message: 'Must differ from the source location' },
    ]);
  }
}

/** 422 — a line references a variant that isn't live in this tenant. */
export class InvalidTransferLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(variantId: string) {
    super(`Variant "${variantId}" does not exist.`, [
      { field: 'lines', message: `Variant "${variantId}" does not exist in this organization` },
    ]);
  }
}

/** 422 — a receive request references a line that isn't on the transfer. */
export class UnknownTransferLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(lineId: string) {
    super(`Line "${lineId}" is not on this transfer.`, [
      { field: 'lines', message: `Unknown line "${lineId}"` },
    ]);
  }
}

/** 409 — the requested transition isn't allowed from the transfer's current status. */
export class TransferStateError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message, [{ field: 'status', message }]);
  }
}

/** 409 — receiving more than the in-transit (dispatched-not-yet-received) quantity on a line. */
export class OverReceiveTransferError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(lineId: string, inTransit: number) {
    super(`Cannot receive more than the ${inTransit} in transit on line "${lineId}".`, [
      { field: 'quantity', message: `Exceeds the ${inTransit} in transit` },
    ]);
  }
}
