import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/**
 * Auth domain errors. Each carries the stable machine code + HTTP status the global exception filter maps to
 * the API error envelope. Authentication failures are deliberately vague (never reveal whether the email or
 * the password was wrong).
 */

/** 401 — bad email/password, or a missing/expired/invalid session. */
export class InvalidCredentialsError extends DomainError {
  readonly code: ErrorCode = 'UNAUTHORIZED';
  readonly httpStatus = 401;

  constructor(message = 'Invalid email or password.') {
    super(message);
  }
}

/** 409 — an account already exists for this email. */
export class EmailTakenError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'An account with this email already exists.') {
    super(message);
  }
}

/** 409 — a pending invitation already exists for this email in the organization. */
export class InvitationExistsError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'A pending invitation already exists for this email.') {
    super(message);
  }
}

/** 400 — the invitation token is unknown, already used, revoked, or expired. */
export class InvalidInvitationError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message = 'This invitation is invalid or has expired.') {
    super(message);
  }
}

/** 404 — no such member in the active organization (also used for cross-tenant ids). */
export class MemberNotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(message = 'Member not found.') {
    super(message);
  }
}

/** 409 — the action would leave the organization without an Owner (exactly one Owner is required). */
export class LastOwnerError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'The organization must always have at least one Owner.') {
    super(message);
  }
}
