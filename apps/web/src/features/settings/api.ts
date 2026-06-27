import {
  OrganizationSettingsResponseSchema,
  type OrganizationSettingsResponse,
  type UpdateOrganizationSettingsRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/settings';

/** Settings REST bindings. Each call validates the response against the shared Zod contract. */
export function getSettings(signal?: AbortSignal): Promise<OrganizationSettingsResponse> {
  return apiRequest(BASE, {
    schema: OrganizationSettingsResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function updateSettings(
  body: UpdateOrganizationSettingsRequest,
): Promise<OrganizationSettingsResponse> {
  return apiRequest(BASE, { method: 'PATCH', body, schema: OrganizationSettingsResponseSchema });
}
