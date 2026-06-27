import type { ErrorCode } from '@stockflow/types';
import { DomainError } from '../../../common/errors';

/** 409 — a live variant already uses this SKU in the tenant. */
export class DuplicateSkuError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(sku: string) {
    super(`A variant with SKU "${sku}" already exists.`);
  }
}

/** 404 — product not found (or belongs to another tenant). */
export class ProductNotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(id: string) {
    super(`Product "${id}" was not found.`);
  }
}

/** 404 — variant not found under the given product. */
export class VariantNotFoundError extends DomainError {
  readonly code: ErrorCode = 'NOT_FOUND';
  readonly httpStatus = 404;
  constructor(id: string) {
    super(`Variant "${id}" was not found.`);
  }
}

/** 409 — cannot remove the last variant of a product. */
export class LastVariantError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(productId: string) {
    super(`Cannot delete the last variant of product "${productId}". Delete the product instead.`);
  }
}

/** 409 — variant still has stock or open orders; archive instead of deleting. */
export class VariantInUseError extends DomainError {
  readonly code: ErrorCode = 'CONFLICT';
  readonly httpStatus = 409;
  constructor(sku: string) {
    super(`Variant "${sku}" has stock or open orders and cannot be deleted. Archive it instead.`);
  }
}

/** 422 — a referenced category/brand/unit does not exist in the tenant. */
export class InvalidReferenceError extends DomainError {
  readonly code: ErrorCode = 'VALIDATION_ERROR';
  readonly httpStatus = 422;
  constructor(field: string, id: string) {
    super(`Referenced ${field} "${id}" does not exist.`, [
      { field, message: 'does not exist in this organization' },
    ]);
  }
}
