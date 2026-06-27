import type { PlanId, SubscriptionStatus } from '@stockflow/types';

/**
 * Billing domain entity — the per-tenant subscription singleton (`organizationId` is its identity).
 * Framework-free. `externalId` is the provider's subscription id (Stripe later; null for the fake provider).
 * Timestamps are null until the tenant first subscribes (a GET returns the ephemeral free default).
 */
export interface SubscriptionEntity {
  organizationId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  externalId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}
