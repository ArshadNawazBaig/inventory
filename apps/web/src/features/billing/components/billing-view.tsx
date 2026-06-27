'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, toast } from '@stockflow/ui';
import type { PlanId, SubscriptionStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { usePlans, useSubscription, useUsage } from '../queries';
import { useCancelSubscription, useChangePlan } from '../mutations';
import { subscriptionStatusLabel } from '../lib/billing-format';
import { PlanCard } from './plan-card';
import { UsagePanel } from './usage-panel';

const STATUS_TONE: Record<SubscriptionStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  canceled: 'danger',
};

export function BillingView() {
  const plansQuery = usePlans();
  const subscriptionQuery = useSubscription();
  const usageQuery = useUsage();
  const change = useChangePlan();
  const cancel = useCancelSubscription();
  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null);

  const isError = plansQuery.isError || subscriptionQuery.isError || usageQuery.isError;
  const isLoading = plansQuery.isLoading || subscriptionQuery.isLoading || usageQuery.isLoading;

  if (isError) {
    return (
      <ErrorState
        title="Couldn’t load billing"
        description={errorMessage(plansQuery.error ?? subscriptionQuery.error ?? usageQuery.error)}
        onRetry={() => {
          void plansQuery.refetch();
          void subscriptionQuery.refetch();
          void usageQuery.refetch();
        }}
      />
    );
  }

  if (isLoading || !plansQuery.data || !subscriptionQuery.data || !usageQuery.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton variant="rounded" className="h-28 w-full" />
        <Skeleton variant="rounded" className="h-40 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} variant="rounded" className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const { plans } = plansQuery.data;
  const subscription = subscriptionQuery.data;
  const currentPlan = plans.find((plan) => plan.id === subscription.planId);
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;
  const canCancel = subscription.planId !== 'free' && !subscription.cancelAtPeriodEnd;

  const onSelect = async (planId: PlanId) => {
    setPendingPlanId(planId);
    try {
      await change.mutateAsync({ planId });
      toast.success('Plan updated');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPendingPlanId(null);
    }
  };

  const onCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success('Subscription will cancel at the end of the period');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-foreground">{currentPlan?.name ?? subscription.planId}</span>
              <Badge tone={STATUS_TONE[subscription.status]}>
                {subscriptionStatusLabel(subscription.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd && periodEnd
                ? `Cancels on ${periodEnd}`
                : periodEnd
                  ? `Renews on ${periodEnd}`
                  : 'No active billing period'}
            </p>
          </div>
          {canCancel ? (
            <Button variant="outline" onClick={onCancel} loading={cancel.isPending} loadingText="Cancelling…">
              Cancel subscription
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <UsagePanel usage={usageQuery.data} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === subscription.planId}
              pending={pendingPlanId === plan.id}
              disabled={change.isPending}
              onSelect={() => void onSelect(plan.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
