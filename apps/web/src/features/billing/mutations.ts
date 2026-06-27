'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangePlanRequest, SubscriptionResponse } from '@stockflow/types';
import { cancelSubscription, changePlan } from './api';
import { billingKeys } from './query-keys';

/** Change the active plan. Seeds the subscription cache and refreshes usage (limits changed). */
export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation<SubscriptionResponse, Error, ChangePlanRequest>({
    mutationFn: (body) => changePlan(body),
    onSuccess: (data) => {
      qc.setQueryData(billingKeys.subscription(), data);
      void qc.invalidateQueries({ queryKey: billingKeys.usage() });
    },
  });
}

/** Schedule cancellation at period end. */
export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation<SubscriptionResponse, Error, void>({
    mutationFn: () => cancelSubscription(),
    onSuccess: (data) => qc.setQueryData(billingKeys.subscription(), data),
  });
}
