import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/**
 * Catalog-lookup-specific error. The generic not-found / duplicate errors live in
 * `common/resource` ({@link ResourceNotFoundError} / {@link DuplicateResourceError}).
 */

/** 422 — category parent is missing, self-referential, or would create a cycle. */
export class InvalidParentError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message, [{ field: 'parentId', message }]);
  }
}
