import {
  BillingUsageResponseSchema,
  PlanListResponseSchema,
  SubscriptionResponseSchema,
  type BillingUsageResponse,
  type ChangePlanRequest,
  type PlanListResponse,
  type SubscriptionResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/billing';

/** Billing REST bindings. Each call validates the response against the shared Zod contract. */
export function getPlans(signal?: AbortSignal): Promise<PlanListResponse> {
  return apiRequest(`${BASE}/plans`, { schema: PlanListResponseSchema, ...(signal ? { signal } : {}) });
}

export function getSubscription(signal?: AbortSignal): Promise<SubscriptionResponse> {
  return apiRequest(`${BASE}/subscription`, {
    schema: SubscriptionResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getUsage(signal?: AbortSignal): Promise<BillingUsageResponse> {
  return apiRequest(`${BASE}/usage`, { schema: BillingUsageResponseSchema, ...(signal ? { signal } : {}) });
}

export function changePlan(body: ChangePlanRequest): Promise<SubscriptionResponse> {
  return apiRequest(`${BASE}/subscription/change`, {
    method: 'POST',
    body,
    schema: SubscriptionResponseSchema,
  });
}

export function cancelSubscription(): Promise<SubscriptionResponse> {
  return apiRequest(`${BASE}/subscription/cancel`, { method: 'POST', schema: SubscriptionResponseSchema });
}
