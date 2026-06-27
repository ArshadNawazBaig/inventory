import type { LookupListQuery, PageMeta } from '@stockflow/types';
import { apiRequest } from '@/lib/api';
import type { ResourceDescriptor } from './descriptor';
import type { ResourceRecord } from './types';

export interface ResourceListResult<T> {
  data: T[];
  meta: PageMeta;
}

/**
 * Generic REST bindings for any managed resource, parameterised by a {@link ResourceDescriptor}. Each
 * call validates the response against the resource's shared Zod contract (output validation). Transport
 * only; caching/invalidation lives in the hooks. (`LookupListQuery` is the canonical named-resource list
 * query shape — page/limit/sort/status/q — reused across all CRUD resources.)
 */

export function listResources<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  query: LookupListQuery,
  signal?: AbortSignal,
): Promise<ResourceListResult<T>> {
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

export function getResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  id: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}`, {
    schema: descriptor.responseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  body: unknown,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}`, {
    method: 'POST',
    body,
    schema: descriptor.responseSchema,
  });
}

export function updateResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  id: string,
  body: unknown,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}`, {
    method: 'PATCH',
    body,
    schema: descriptor.responseSchema,
  });
}

export function archiveResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  id: string,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}/archive`, {
    method: 'POST',
    schema: descriptor.responseSchema,
  });
}

export function restoreResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  id: string,
): Promise<T> {
  return apiRequest(`/v1/${descriptor.resource}/${id}/restore`, {
    method: 'POST',
    schema: descriptor.responseSchema,
  });
}

export function deleteResource<T extends ResourceRecord>(
  descriptor: ResourceDescriptor<T>,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/v1/${descriptor.resource}/${id}`, { method: 'DELETE' });
}
