import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/**
 * Locations-specific errors. Generic not-found / duplicate-code errors live in `common/resource`
 * ({@link ResourceNotFoundError} / {@link DuplicateResourceError}).
 */

/** 422 — the referenced warehouse is missing or not live in this tenant. */
export class InvalidWarehouseError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'warehouseId', message }]);
  }
}

/** 422 — parent location is missing, in another warehouse, self-referential, or would create a cycle. */
export class InvalidParentLocationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'parentLocationId', message }]);
  }
}

/** 409 — cannot delete a location that still has live child locations. */
export class LocationHasChildrenError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor() {
    super('This location has child locations; delete or move them first.', [
      { field: 'id', message: 'Location has child locations' },
    ]);
  }
}
