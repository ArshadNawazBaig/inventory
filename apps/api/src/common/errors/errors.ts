import type { ErrorCode, ErrorDetail } from '@stockflow/types';
import { DomainError } from './domain-error';

/** 400 — malformed request or failed input validation (field-level details). */
export class ValidationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message = 'Validation failed.', details?: ErrorDetail[]) {
    super(message, details);
  }
}

/** 401 — missing, invalid, or expired authentication. */
export class UnauthorizedError extends DomainError {
  readonly code: ErrorCode = 'UNAUTHORIZED';
  readonly httpStatus = 401;

  constructor(message = 'Authentication is required.') {
    super(message);
  }
}

/** 403 — authenticated but lacking the required permission. */
export class ForbiddenError extends DomainError {
  readonly code: ErrorCode = 'FORBIDDEN';
  readonly httpStatus = 403;

  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
  }
}

/** 404 — resource not found (also used for cross-tenant ids to avoid existence leaks). */
export class NotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(message = 'The requested resource was not found.') {
    super(message);
  }
}

/** 409 — unique violation, stale version, or invalid state transition. */
export class ConflictError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'The request conflicts with the current state.') {
    super(message);
  }
}

/** 429 — too many requests. */
export class RateLimitedError extends DomainError {
  readonly code: ErrorCode = 'RATE_LIMITED';
  readonly httpStatus = 429;

  constructor(message = 'Too many requests. Please try again later.') {
    super(message);
  }
}

/** 5xx — unexpected failure. Status overridable (e.g. 503 for timeouts). */
export class InternalError extends DomainError {
  readonly code: ErrorCode = 'INTERNAL_ERROR';
  readonly httpStatus: number;

  constructor(message = 'An unexpected error occurred.', httpStatus = 500) {
    super(message);
    this.httpStatus = httpStatus;
  }
}
