import type { LookupListQuery, PageMeta } from '@stockflow/types';
import { apiRequest } from '@/lib/api';
import type { LookupDescriptor } from './descriptors';
import type { LookupRecord } from './types';

export interface LookupListResult<T> {
  data: T[];
  meta: PageMeta;
}

/**
 * Generic REST bindings for any catalog lookup, parameterised by a {@link LookupDescriptor}. Each call
 * validates the response against the resource's shared Zod contract (output validation). Transport only;
 * caching/invalidation lives in the hooks.
 */

export function listLookups<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  query: LookupListQuery,
  signal?: AbortSignal,
): Promise<LookupListResult<T>> {
  return apiRequest(`/v1/${descriptor.resource}`, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      status: query.status,
      q: query.q,
    },
    schema: descriptor.listSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  id: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}`, {
    schema: descriptor.responseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  body: unknown,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}`, {
    method: 'POST',
    body,
    schema: descriptor.responseSchema,
  });
}

export function updateLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  id: string,
  body: unknown,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}`, {
    method: 'PATCH',
    body,
    schema: descriptor.responseSchema,
  });
}

export function archiveLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  id: string,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}/archive`, {
    method: 'POST',
    schema: descriptor.responseSchema,
  });
}

export function restoreLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  id: string,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}/restore`, {
    method: 'POST',
    schema: descriptor.responseSchema,
  });
}

export function deleteLookup<T extends LookupRecord>(
  descriptor: LookupDescriptor<T>,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/v1/${descriptor.resource}/${id}`, { method: 'DELETE' });
}
