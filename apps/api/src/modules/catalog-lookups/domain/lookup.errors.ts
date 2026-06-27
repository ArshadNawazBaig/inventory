import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';
import type { LookupResource } from './entities';

function label(resource: LookupResource): string {
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

/** 404 — lookup not found (or belongs to another tenant). */
export class LookupNotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(resource: LookupResource, id: string) {
    super(`${label(resource)} "${id}" was not found.`);
  }
}

/** 409 — a live lookup already uses this name (or, for units, code) in the tenant. */
export class DuplicateLookupError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(resource: LookupResource, field: 'name' | 'code', value: string) {
    super(`A ${resource} with ${field} "${value}" already exists.`, [
      { field, message: `${field} must be unique in this organization` },
    ]);
  }
}

/** 422 — category parent is missing, self-referential, or would create a cycle. */
export class InvalidParentError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'parentId', message }]);
  }
}
