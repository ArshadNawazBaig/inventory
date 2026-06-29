import { Schema } from 'mongoose';
import type { PlanId, SubscriptionStatus } from '@stockflow/types';

/**
 * Mongoose schema for the per-tenant subscription **singleton** — one document per tenant. The tenant is the
 * identity, so **`_id` is the `organizationId`** (a string); the `_id` is the single source of truth,
 * reconstructed by the mapper. `versionKey` is off. `externalId` is the provider's subscription id (Stripe
 * later; null for the fake provider). Period/timestamps are nullable until the tenant first subscribes (a GET
 * returns the ephemeral free default without persisting). In production this row is kept in sync with Stripe
 * via webhooks.
 */

export const SUBSCRIPTION_MODEL = 'Subscription';

/** The stored subscription document — the entity shape with `organizationId` carried by `_id`. */
export interface SubscriptionDoc {
  _id: string; // = organizationId
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

export const SubscriptionSchema = new Schema<SubscriptionDoc>(
  {
    _id: { type: String },
    planId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, required: true },
    externalId: { type: String, default: null },
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'subscriptions', versionKey: false },
);
