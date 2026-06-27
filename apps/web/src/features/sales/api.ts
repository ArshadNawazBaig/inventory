import {
  SalesOrderListResponseSchema,
  SalesOrderResponseSchema,
  type CreateSalesOrderRequest,
  type FulfillSalesOrderRequest,
  type SalesOrderListQuery,
  type SalesOrderListResponse,
  type SalesOrderResponse,
  type UpdateSalesOrderRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/sales-orders';

/** Sales REST bindings. Each call validates the response against the shared Zod contract. */
export function listSalesOrders(
  query: SalesOrderListQuery,
  signal?: AbortSignal,
): Promise<SalesOrderListResponse> {
  return apiRequest(BASE, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      status: query.status,
      customerId: query.customerId,
      q: query.q,
    },
    schema: SalesOrderListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getSalesOrder(id: string, signal?: AbortSignal): Promise<SalesOrderResponse> {
  return apiRequest(`${BASE}/${id}`, { schema: SalesOrderResponseSchema, ...(signal ? { signal } : {}) });
}

export function createSalesOrder(body: CreateSalesOrderRequest): Promise<SalesOrderResponse> {
  return apiRequest(BASE, { method: 'POST', body, schema: SalesOrderResponseSchema });
}

export function updateSalesOrder(id: string, body: UpdateSalesOrderRequest): Promise<SalesOrderResponse> {
  return apiRequest(`${BASE}/${id}`, { method: 'PATCH', body, schema: SalesOrderResponseSchema });
}

export function confirmSalesOrder(id: string): Promise<SalesOrderResponse> {
  return apiRequest(`${BASE}/${id}/confirm`, { method: 'POST', schema: SalesOrderResponseSchema });
}

export function fulfillSalesOrder(
  id: string,
  body: FulfillSalesOrderRequest,
): Promise<SalesOrderResponse> {
  return apiRequest(`${BASE}/${id}/fulfill`, { method: 'POST', body, schema: SalesOrderResponseSchema });
}

export function cancelSalesOrder(id: string): Promise<SalesOrderResponse> {
  return apiRequest(`${BASE}/${id}/cancel`, { method: 'POST', schema: SalesOrderResponseSchema });
}
