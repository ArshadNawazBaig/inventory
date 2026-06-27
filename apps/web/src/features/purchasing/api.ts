import {
  PurchaseOrderListResponseSchema,
  PurchaseOrderResponseSchema,
  type CreatePurchaseOrderRequest,
  type PurchaseOrderListQuery,
  type PurchaseOrderListResponse,
  type PurchaseOrderResponse,
  type ReceivePurchaseOrderRequest,
  type UpdatePurchaseOrderRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/purchase-orders';

/** Purchasing REST bindings. Each call validates the response against the shared Zod contract. */
export function listPurchaseOrders(
  query: PurchaseOrderListQuery,
  signal?: AbortSignal,
): Promise<PurchaseOrderListResponse> {
  return apiRequest(BASE, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      status: query.status,
      supplierId: query.supplierId,
      q: query.q,
    },
    schema: PurchaseOrderListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getPurchaseOrder(id: string, signal?: AbortSignal): Promise<PurchaseOrderResponse> {
  return apiRequest(`${BASE}/${id}`, {
    schema: PurchaseOrderResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createPurchaseOrder(body: CreatePurchaseOrderRequest): Promise<PurchaseOrderResponse> {
  return apiRequest(BASE, { method: 'POST', body, schema: PurchaseOrderResponseSchema });
}

export function updatePurchaseOrder(
  id: string,
  body: UpdatePurchaseOrderRequest,
): Promise<PurchaseOrderResponse> {
  return apiRequest(`${BASE}/${id}`, { method: 'PATCH', body, schema: PurchaseOrderResponseSchema });
}

export function submitPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
  return apiRequest(`${BASE}/${id}/submit`, { method: 'POST', schema: PurchaseOrderResponseSchema });
}

export function receivePurchaseOrder(
  id: string,
  body: ReceivePurchaseOrderRequest,
): Promise<PurchaseOrderResponse> {
  return apiRequest(`${BASE}/${id}/receive`, { method: 'POST', body, schema: PurchaseOrderResponseSchema });
}

export function cancelPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
  return apiRequest(`${BASE}/${id}/cancel`, { method: 'POST', schema: PurchaseOrderResponseSchema });
}
