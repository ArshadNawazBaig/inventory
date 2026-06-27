import type { Plan } from '@stockflow/types';
import type { SubscriptionEntity } from '../domain/entities';

/** Persistence port for the subscription singleton. Tenant-scoped by `organizationId` (the identity). */
export interface SubscriptionRepository {
  findByOrg(organizationId: string): Promise<SubscriptionEntity | null>;
  upsert(subscription: SubscriptionEntity): Promise<SubscriptionEntity>;
}

/** The provider's view of a subscription after a change (the bits the provider owns, not the plan choice). */
export interface ProviderSubscription {
  status: SubscriptionEntity['status'];
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  externalId: string | null;
}

/**
 * The payment-provider seam (Stripe in production; a fake provider until keys + webhooks land). `changePlan`
 * provisions/updates the subscription for a plan; `cancel` schedules cancellation. The application never talks
 * to Stripe directly — it persists what the provider returns.
 */
export interface BillingProviderPort {
  changePlan(input: {
    organizationId: string;
    plan: Plan;
    current: SubscriptionEntity | null;
    now: Date;
  }): Promise<ProviderSubscription>;
  cancel(input: { current: SubscriptionEntity; now: Date }): Promise<ProviderSubscription>;
}

/** Read window into Catalog — count live variants (billing usage/entitlements). */
export interface BillingCatalogPort {
  countVariants(organizationId: string): Promise<number>;
}

/** Read window into Locations — count live locations (billing usage/entitlements). */
export interface BillingLocationPort {
  countLocations(organizationId: string): Promise<number>;
}

// ─── DI tokens (framework-agnostic symbols; wired in billing.module.ts) ───────────
export const SUBSCRIPTION_REPOSITORY = Symbol('SubscriptionRepository');
export const BILLING_PROVIDER = Symbol('BillingProviderPort');
export const BILLING_CATALOG = Symbol('BillingCatalogPort');
export const BILLING_LOCATION = Symbol('BillingLocationPort');
export const BILLING_CLOCK = Symbol('BillingClock');
