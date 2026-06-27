import { z } from 'zod';

/** Branded ID helper — prevents mixing ids of different entities at compile time. */
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type OrganizationId = Brand<string, 'OrganizationId'>;

/** Standard pagination query shared by all list endpoints. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Standard API error codes (machine-readable, stable). */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** A single field-level validation problem. */
export interface ErrorDetail {
  field: string;
  message: string;
}

/** The body of a StockFlow API error (stable, machine-readable). */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
  requestId: string;
}

/** The full error response envelope returned by every endpoint on failure. */
export interface ApiErrorResponse {
  error: ApiErrorBody;
}

/** Health check response contract (used by the API). */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// Catalog (Product module) contracts.
export * from './catalog';

// Catalog lookups (Categories · Brands · Units) contracts.
export * from './catalog-lookups';

// Parties (Suppliers · Customers) contracts.
export * from './parties';

// Locations (Warehouses · Locations) contracts.
export * from './locations';

// Inventory (stock ledger · levels · adjustments) contracts.
export * from './inventory';

// Purchasing (Purchase Orders) contracts.
export * from './purchasing';

// Sales (Sales Orders) contracts.
export * from './sales';

// Transfers (inter-location stock moves) contracts.
export * from './transfers';

// Returns (customer + supplier returns) contracts.
export * from './returns';
