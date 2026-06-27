import { z } from 'zod';

/**
 * Billing contracts — the single source of truth for validation AND types, shared by API + worker + web. See
 * docs/modules/billing.md. Billing is a per-tenant **subscription** against a fixed **plan catalog**; payment
 * is abstracted behind a provider port (Stripe later, a fake provider now). Money is integer minor units.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const BILLING_PERMISSIONS = { view: 'billing.view', manage: 'billing.manage' } as const;
export type BillingPermission = (typeof BILLING_PERMISSIONS)[keyof typeof BILLING_PERMISSIONS];

// ─── Enums ───────────────────────────────────────────────────────────────────
export const PLAN_IDS = ['free', 'starter', 'growth', 'enterprise'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const BILLING_INTERVALS = ['month', 'year'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** Stripe-aligned subscription lifecycle (the subset we model). */
export const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// ─── Plan catalog ──────────────────────────────────────────────────────────────
/** A `null` limit means unlimited. */
export const PlanLimitsSchema = z.object({
  maxVariants: z.number().int().nullable(),
  maxLocations: z.number().int().nullable(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanSchema = z.object({
  id: z.enum(PLAN_IDS),
  name: z.string(),
  /** `null` for custom-priced plans (e.g. enterprise — "contact us"). */
  priceMinor: z.number().int().nullable(),
  currency: z.string(),
  interval: z.enum(BILLING_INTERVALS),
  limits: PlanLimitsSchema,
  features: z.array(z.string()),
});
export type Plan = z.infer<typeof PlanSchema>;

export const PlanListResponseSchema = z.object({ plans: z.array(PlanSchema) });
export type PlanListResponse = z.infer<typeof PlanListResponseSchema>;

/** The fixed plan catalog (product config, not per-tenant). Stripe price ids attach server-side later. */
export const BILLING_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMinor: 0,
    currency: 'USD',
    interval: 'month',
    limits: { maxVariants: 50, maxLocations: 1 },
    features: ['Core inventory', 'Single location', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMinor: 2900,
    currency: 'USD',
    interval: 'month',
    limits: { maxVariants: 1000, maxLocations: 5 },
    features: ['Everything in Free', 'Up to 5 locations', 'Reports', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMinor: 9900,
    currency: 'USD',
    interval: 'month',
    limits: { maxVariants: 25000, maxLocations: 25 },
    features: ['Everything in Starter', 'Up to 25 locations', 'API access', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMinor: null,
    currency: 'USD',
    interval: 'month',
    limits: { maxVariants: null, maxLocations: null },
    features: ['Everything in Growth', 'Unlimited scale', 'SSO', 'Dedicated support'],
  },
];

// ─── Subscription ──────────────────────────────────────────────────────────────
export const SubscriptionResponseSchema = z.object({
  planId: z.enum(PLAN_IDS),
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  updatedAt: z.string().nullable(),
});
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

export const ChangePlanRequestSchema = z.object({ planId: z.enum(PLAN_IDS) }).strict();
export type ChangePlanRequest = z.infer<typeof ChangePlanRequestSchema>;

// ─── Usage / entitlements ──────────────────────────────────────────────────────
/** A usage metric against its plan limit (`limit` null = unlimited). */
export const UsageMetricSchema = z.object({
  used: z.number().int(),
  limit: z.number().int().nullable(),
});
export type UsageMetric = z.infer<typeof UsageMetricSchema>;

export const BillingUsageResponseSchema = z.object({
  planId: z.enum(PLAN_IDS),
  usage: z.object({
    variants: UsageMetricSchema,
    locations: UsageMetricSchema,
  }),
});
export type BillingUsageResponse = z.infer<typeof BillingUsageResponseSchema>;
