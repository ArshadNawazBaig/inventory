import {
  DashboardSummaryResponseSchema,
  type DashboardSummaryResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/dashboard';

/** Dashboard REST binding (read-only). Validates the response against the shared Zod contract. */
export function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummaryResponse> {
  return apiRequest(`${BASE}/summary`, {
    schema: DashboardSummaryResponseSchema,
    ...(signal ? { signal } : {}),
  });
}
