import {
  LocationListResponseSchema,
  LocationResponseSchema,
  type LocationListQuery,
  type LocationListResponse,
  type LocationResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

/**
 * REST bindings for Locations. Unlike the generic resource toolkit, the list is warehouse-scoped and tree
 * aware (`warehouseId`/`parentLocationId`/`type` filters). Each call validates the response against the
 * shared Zod contract (output validation). Transport only; caching/invalidation lives in the hooks.
 */

export function listLocations(query: LocationListQuery, signal?: AbortSignal): Promise<LocationListResponse> {
  return apiRequest('/v1/locations', {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      status: query.status,
      q: query.q,
      warehouseId: query.warehouseId,
      parentLocationId: query.parentLocationId,
      type: query.type,
    },
    schema: LocationListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createLocation(body: unknown): Promise<LocationResponse> {
  return apiRequest('/v1/locations', { method: 'POST', body, schema: LocationResponseSchema });
}

export function updateLocation(id: string, body: unknown): Promise<LocationResponse> {
  return apiRequest(`/v1/locations/${id}`, { method: 'PATCH', body, schema: LocationResponseSchema });
}

export function archiveLocation(id: string): Promise<LocationResponse> {
  return apiRequest(`/v1/locations/${id}/archive`, { method: 'POST', schema: LocationResponseSchema });
}

export function restoreLocation(id: string): Promise<LocationResponse> {
  return apiRequest(`/v1/locations/${id}/restore`, { method: 'POST', schema: LocationResponseSchema });
}

export function deleteLocation(id: string): Promise<void> {
  return apiRequest<void>(`/v1/locations/${id}`, { method: 'DELETE' });
}
