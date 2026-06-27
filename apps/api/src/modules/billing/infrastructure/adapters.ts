import { Injectable } from '@nestjs/common';
import type { Plan } from '@stockflow/types';
import type { BillingProviderPort, ProviderSubscription } from '../application/ports';
import type { SubscriptionEntity } from '../domain/entities';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS: Record<Plan['interval'], number> = { month: 30, year: 365 };

/**
 * Fake billing provider — stands in for Stripe until API keys + webhooks land. It "succeeds" synchronously
 * (as if checkout completed): activates the subscription and computes a billing period from the plan interval.
 * The real `StripeBillingProvider` implements the same port (returning a checkout URL / confirming via webhook)
 * and drops in without touching the application.
 */
@Injectable()
export class FakeBillingProvider implements BillingProviderPort {
  changePlan(input: { plan: Plan; now: Date }): Promise<ProviderSubscription> {
    const end = new Date(input.now.getTime() + PERIOD_DAYS[input.plan.interval] * DAY_MS);
    return Promise.resolve({
      status: 'active',
      currentPeriodStart: input.now,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      externalId: `fake_sub_${input.plan.id}`,
    });
  }

  cancel(input: { current: SubscriptionEntity; now: Date }): Promise<ProviderSubscription> {
    // Stripe-style: stays active until the period ends, then cancels.
    return Promise.resolve({
      status: input.current.status === 'canceled' ? 'canceled' : 'active',
      currentPeriodStart: input.current.currentPeriodStart,
      currentPeriodEnd: input.current.currentPeriodEnd,
      cancelAtPeriodEnd: true,
      externalId: input.current.externalId,
    });
  }
}
