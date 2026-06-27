import {
  AdjustmentResultSchema,
  StockLevelListResponseSchema,
  StockMovementListResponseSchema,
  type AdjustmentResult,
  type CreateAdjustmentRequest,
  type StockLevelListQuery,
  type StockLevelListResponse,
  type StockMovementListQuery,
  type StockMovementListResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

/**
 * Inventory REST bindings. Each call validates the response against the shared Zod contract (output
 * validation). Transport only; caching/invalidation lives in the hooks.
 */

export function listStockLevels(
  query: StockLevelListQuery,
  signal?: AbortSignal,
): Promise<StockLevelListResponse> {
  return apiRequest('/v1/inventory/levels', {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      variantId: query.variantId,
      locationId: query.locationId,
    },
    schema: StockLevelListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function listStockMovements(
  query: StockMovementListQuery,
  signal?: AbortSignal,
): Promise<StockMovementListResponse> {
  return apiRequest('/v1/inventory/movements', {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      variantId: query.variantId,
      locationId: query.locationId,
      type: query.type,
    },
    schema: StockMovementListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createAdjustment(body: CreateAdjustmentRequest): Promise<AdjustmentResult> {
  return apiRequest('/v1/inventory/adjustments', {
    method: 'POST',
    body,
    schema: AdjustmentResultSchema,
  });
}
