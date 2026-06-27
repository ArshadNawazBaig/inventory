import {
  InventoryValuationResponseSchema,
  LowStockResponseSchema,
  type InventoryValuationQuery,
  type InventoryValuationResponse,
  type LowStockListQuery,
  type LowStockResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/reports';

/** Reports REST bindings (read-only). Each call validates the response against the shared Zod contract. */
export function getInventoryValuation(
  query: InventoryValuationQuery,
  signal?: AbortSignal,
): Promise<InventoryValuationResponse> {
  return apiRequest(`${BASE}/inventory-valuation`, {
    query: { warehouseId: query.warehouseId },
    schema: InventoryValuationResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getLowStock(query: LowStockListQuery, signal?: AbortSignal): Promise<LowStockResponse> {
  return apiRequest(`${BASE}/low-stock`, {
    query: { page: query.page, limit: query.limit },
    schema: LowStockResponseSchema,
    ...(signal ? { signal } : {}),
  });
}
