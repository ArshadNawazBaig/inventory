import {
  BILLING_PLANS,
  type BillingUsageResponse,
  type Plan,
  type PlanId,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { ResourceNotFoundError, type ResourceClock } from '../../../common/resource';
import type { SubscriptionEntity } from '../domain/entities';
import type {
  BillingCatalogPort,
  BillingLocationPort,
  BillingProviderPort,
  SubscriptionRepository,
} from './ports';

/**
 * Billing use cases — the tenant's subscription against the fixed plan catalog. `getSubscription` returns the
 * persisted subscription or the **ephemeral free default** (a read never writes). `changePlan`/`cancel` go
 * through the provider port (Stripe later; a fake now) and persist what it returns. `getUsage` reports current
 * counts against the plan's limits. Payment specifics live behind `BillingProviderPort`.
 */
export class BillingService {
  constructor(
    private readonly repo: SubscriptionRepository,
    private readonly provider: BillingProviderPort,
    private readonly catalog: BillingCatalogPort,
    private readonly locations: BillingLocationPort,
    private readonly clock: ResourceClock,
  ) {}

  listPlans(): Plan[] {
    return BILLING_PLANS;
  }

  /** The tenant's subscription, or the free-plan default if never subscribed (not persisted). */
  async getSubscription(ctx: ActorContext): Promise<SubscriptionEntity> {
    const existing = await this.repo.findByOrg(ctx.organizationId);
    return existing ?? this.freeDefault(ctx.organizationId);
  }

  /** Move the tenant onto a plan via the provider, then persist the resulting subscription. */
  async changePlan(ctx: ActorContext, planId: PlanId): Promise<SubscriptionEntity> {
    const plan = this.planById(planId);
    const current = await this.repo.findByOrg(ctx.organizationId);
    const now = this.clock.now();
    const result = await this.provider.changePlan({
      organizationId: ctx.organizationId,
      plan,
      current,
      now,
    });
    return this.repo.upsert({
      organizationId: ctx.organizationId,
      planId: plan.id,
      status: result.status,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      externalId: result.externalId,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      updatedBy: ctx.actorId,
    });
  }

  /** Schedule cancellation at period end via the provider, then persist. */
  async cancel(ctx: ActorContext): Promise<SubscriptionEntity> {
    const current = (await this.repo.findByOrg(ctx.organizationId)) ?? this.freeDefault(ctx.organizationId);
    const now = this.clock.now();
    const result = await this.provider.cancel({ current, now });
    return this.repo.upsert({
      ...current,
      status: result.status,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      externalId: result.externalId,
      createdAt: current.createdAt ?? now,
      updatedAt: now,
      updatedBy: ctx.actorId,
    });
  }

  /** Current usage measured against the active plan's limits (limit null = unlimited). */
  async getUsage(ctx: ActorContext): Promise<BillingUsageResponse> {
    const subscription = await this.getSubscription(ctx);
    const plan = this.planById(subscription.planId);
    const [variants, locations] = await Promise.all([
      this.catalog.countVariants(ctx.organizationId),
      this.locations.countLocations(ctx.organizationId),
    ]);
    return {
      planId: plan.id,
      usage: {
        variants: { used: variants, limit: plan.limits.maxVariants },
        locations: { used: locations, limit: plan.limits.maxLocations },
      },
    };
  }

  private planById(planId: PlanId): Plan {
    const plan = BILLING_PLANS.find((candidate) => candidate.id === planId);
    if (!plan) throw new ResourceNotFoundError('Plan', planId);
    return plan;
  }

  private freeDefault(organizationId: string): SubscriptionEntity {
    return {
      organizationId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      externalId: null,
      createdAt: null,
      updatedAt: null,
      updatedBy: null,
    };
  }
}
