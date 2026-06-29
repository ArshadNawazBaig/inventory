import {
  SaleListResponseSchema,
  SaleResponseSchema,
  type CreateSaleRequest,
  type SaleListQuery,
  type SaleListResponse,
  type SaleResponse,
} from '@stockflow/types';
import { apiRequest, type QueryValue } from '@/lib/api';

/** POS REST bindings — each call validates the response against the shared Zod contract. */
export function createSale(body: CreateSaleRequest): Promise<SaleResponse> {
  return apiRequest('/v1/pos/sales', { method: 'POST', body, schema: SaleResponseSchema });
}

export function listSales(query: SaleListQuery, signal?: AbortSignal): Promise<SaleListResponse> {
  return apiRequest('/v1/pos/sales', {
    query: query as Record<string, QueryValue>,
    schema: SaleListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}
