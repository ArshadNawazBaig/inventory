import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../errors';

function label(resource: string): string {
  return resource.charAt(0).toUpperCase() + resource.slice(1);
}

/** 404 — resource not found (or belongs to another tenant). */
export class ResourceNotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(resource: string, id: string) {
    super(`${label(resource)} "${id}" was not found.`);
  }
}

/** 409 — a live resource already uses this unique value (name or another field) in the tenant. */
export class DuplicateResourceError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(resource: string, field: string, value: string) {
    super(`A ${resource} with ${field} "${value}" already exists.`, [
      { field, message: `${field} must be unique in this organization` },
    ]);
  }
}
