import { Inject, Injectable } from '@nestjs/common';
import { BILLING_PLANS, type PlanId, type PlanLimits } from '@stockflow/types';
import { SUBSCRIPTION_REPOSITORY, type SubscriptionRepository } from './ports';

const FREE_LIMITS: PlanLimits =
  BILLING_PLANS.find((plan) => plan.id === 'free')?.limits ?? { maxVariants: 50, maxLocations: 1 };

/**
 * The public, read-only query surface other modules use to read tenant **entitlements** — the same pattern as
 * SettingsQuery. A future quota check (e.g. Catalog rejecting a new variant past `maxVariants`) binds here.
 * Falls back to the free-plan limits when a tenant has never subscribed.
 */
@Injectable()
export class BillingQuery {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly repo: SubscriptionRepository,
  ) {}

  /** The active plan's limits (null = unlimited); free-plan limits if never subscribed. */
  async getEntitlements(organizationId: string): Promise<PlanLimits> {
    const subscription = await this.repo.findByOrg(organizationId);
    const planId: PlanId = subscription?.planId ?? 'free';
    return BILLING_PLANS.find((plan) => plan.id === planId)?.limits ?? FREE_LIMITS;
  }
}
