import {
  TransferListResponseSchema,
  TransferResponseSchema,
  type CreateTransferRequest,
  type ReceiveTransferRequest,
  type TransferListQuery,
  type TransferListResponse,
  type TransferResponse,
  type UpdateTransferRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/transfers';

/** Transfers REST bindings. Each call validates the response against the shared Zod contract. */
export function listTransfers(
  query: TransferListQuery,
  signal?: AbortSignal,
): Promise<TransferListResponse> {
  return apiRequest(BASE, {
    query: { page: query.page, limit: query.limit, sort: query.sort, status: query.status, q: query.q },
    schema: TransferListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getTransfer(id: string, signal?: AbortSignal): Promise<TransferResponse> {
  return apiRequest(`${BASE}/${id}`, {
    schema: TransferResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createTransfer(body: CreateTransferRequest): Promise<TransferResponse> {
  return apiRequest(BASE, { method: 'POST', body, schema: TransferResponseSchema });
}

export function updateTransfer(id: string, body: UpdateTransferRequest): Promise<TransferResponse> {
  return apiRequest(`${BASE}/${id}`, { method: 'PATCH', body, schema: TransferResponseSchema });
}

export function dispatchTransfer(id: string): Promise<TransferResponse> {
  return apiRequest(`${BASE}/${id}/dispatch`, { method: 'POST', schema: TransferResponseSchema });
}

export function receiveTransfer(id: string, body: ReceiveTransferRequest): Promise<TransferResponse> {
  return apiRequest(`${BASE}/${id}/receive`, { method: 'POST', body, schema: TransferResponseSchema });
}

export function cancelTransfer(id: string): Promise<TransferResponse> {
  return apiRequest(`${BASE}/${id}/cancel`, { method: 'POST', schema: TransferResponseSchema });
}
