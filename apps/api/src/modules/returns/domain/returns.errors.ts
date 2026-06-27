import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 422 — the return references a party (customer or supplier) that isn't live in this tenant. */
export class InvalidReturnPartyError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(partyId: string) {
    super(`Party "${partyId}" does not exist.`, [
      { field: 'partyId', message: 'Party does not exist in this organization' },
    ]);
  }
}

/** 422 — the return references a location that isn't live in this tenant. */
export class InvalidReturnLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(locationId: string) {
    super(`Location "${locationId}" does not exist.`, [
      { field: 'locationId', message: 'Location does not exist in this organization' },
    ]);
  }
}

/** 422 — a line references a variant that isn't live in this tenant. */
export class InvalidReturnLineError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(variantId: string) {
    super(`Variant "${variantId}" does not exist.`, [
      { field: 'lines', message: `Variant "${variantId}" does not exist in this organization` },
    ]);
  }
}

/** 409 — the requested transition isn't allowed from the return's current status. */
export class ReturnStateError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message, [{ field: 'status', message }]);
  }
}
