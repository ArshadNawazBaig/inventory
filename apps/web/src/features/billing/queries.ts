'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlans, getSubscription, getUsage } from './api';
import { billingKeys } from './query-keys';

/** The fixed plan catalog (rarely changes — held a little longer). */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: ({ signal }) => getPlans(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/** The tenant's current subscription. */
export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: ({ signal }) => getSubscription(signal),
  });
}

/** Current usage against the active plan limits. */
export function useUsage() {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: ({ signal }) => getUsage(signal),
  });
}
