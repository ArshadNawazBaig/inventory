import {
  ReturnListResponseSchema,
  ReturnResponseSchema,
  type CreateReturnRequest,
  type ReturnListQuery,
  type ReturnListResponse,
  type ReturnResponse,
  type UpdateReturnRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/returns';

/** Returns REST bindings. Each call validates the response against the shared Zod contract. */
export function listReturns(query: ReturnListQuery, signal?: AbortSignal): Promise<ReturnListResponse> {
  return apiRequest(BASE, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      kind: query.kind,
      status: query.status,
      q: query.q,
    },
    schema: ReturnListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getReturn(id: string, signal?: AbortSignal): Promise<ReturnResponse> {
  return apiRequest(`${BASE}/${id}`, {
    schema: ReturnResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createReturn(body: CreateReturnRequest): Promise<ReturnResponse> {
  return apiRequest(BASE, { method: 'POST', body, schema: ReturnResponseSchema });
}

export function updateReturn(id: string, body: UpdateReturnRequest): Promise<ReturnResponse> {
  return apiRequest(`${BASE}/${id}`, { method: 'PATCH', body, schema: ReturnResponseSchema });
}

export function completeReturn(id: string): Promise<ReturnResponse> {
  return apiRequest(`${BASE}/${id}/complete`, { method: 'POST', schema: ReturnResponseSchema });
}

export function cancelReturn(id: string): Promise<ReturnResponse> {
  return apiRequest(`${BASE}/${id}/cancel`, { method: 'POST', schema: ReturnResponseSchema });
}
