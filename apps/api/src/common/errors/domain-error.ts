import type { ErrorCode, ErrorDetail } from '@stockflow/types';

/**
 * Base class for typed domain/application errors. Services throw these; the global
 * {@link AllExceptionsFilter} maps them to the stable API error envelope. Carrying
 * the HTTP status + machine code on the error keeps mapping in one place and stops
 * internal details from leaking to clients.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly httpStatus: number;
  readonly details?: ErrorDetail[];

  constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
