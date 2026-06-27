import { describe, it, expect } from 'vitest';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ResourceClock } from '../../../common/resource';
import { FakeBillingProvider } from '../infrastructure/adapters';
import { InMemorySubscriptionRepository } from '../infrastructure/in-memory.repository';
import { BillingService } from './billing.service';
import { BillingQuery } from './billing-query.service';
import type { BillingCatalogPort, BillingLocationPort } from './ports';

const ctx: ActorContext = { organizationId: 'org-1', actorId: 'user-ann' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-bob' };
const AT = new Date('2026-06-28T09:00:00.000Z');

class FixedClock implements ResourceClock {
  now(): Date {
    return AT;
  }
}
class FakeCatalog implements BillingCatalogPort {
  constructor(private readonly counts: Record<string, number>) {}
  countVariants(org: string): Promise<number> {
    return Promise.resolve(this.counts[org] ?? 0);
  }
}
class FakeLocations implements BillingLocationPort {
  constructor(private readonly counts: Record<string, number>) {}
  countLocations(org: string): Promise<number> {
    return Promise.resolve(this.counts[org] ?? 0);
  }
}

function make() {
  const repo = new InMemorySubscriptionRepository();
  const service = new BillingService(
    repo,
    new FakeBillingProvider(),
    new FakeCatalog({ 'org-1': 1200 }),
    new FakeLocations({ 'org-1': 3 }),
    new FixedClock(),
  );
  return { repo, service, query: new BillingQuery(repo) };
}

describe('BillingService.getSubscription', () => {
  it('returns the free-plan default (unpersisted) when never subscribed', async () => {
    const { repo, service } = make();
    const sub = await service.getSubscription(ctx);
    expect(sub).toMatchObject({ planId: 'free', status: 'active', cancelAtPeriodEnd: false, updatedAt: null });
    expect(await repo.findByOrg('org-1')).toBeNull(); // a read never persists
  });
});

describe('BillingService.changePlan', () => {
  it('moves to the plan, activates with a computed period, and persists', async () => {
    const { service } = make();
    const sub = await service.changePlan(ctx, 'growth');
    expect(sub).toMatchObject({ planId: 'growth', status: 'active', cancelAtPeriodEnd: false, updatedBy: 'user-ann' });
    expect(sub.currentPeriodStart).toEqual(AT);
    expect(sub.currentPeriodEnd).toEqual(new Date(AT.getTime() + 30 * 24 * 60 * 60 * 1000));
    expect(sub.externalId).toBe('fake_sub_growth');
    const reread = await service.getSubscription(ctx);
    expect(reread.planId).toBe('growth');
  });
});

describe('BillingService.cancel', () => {
  it('schedules cancellation at period end', async () => {
    const { service } = make();
    await service.changePlan(ctx, 'starter');
    const canceled = await service.cancel(ctx);
    expect(canceled).toMatchObject({ planId: 'starter', cancelAtPeriodEnd: true });
  });
});

describe('BillingService.getUsage', () => {
  it('reports usage against the active plan limits', async () => {
    const { service } = make();
    const free = await service.getUsage(ctx);
    expect(free).toEqual({
      planId: 'free',
      usage: { variants: { used: 1200, limit: 50 }, locations: { used: 3, limit: 1 } },
    });
    await service.changePlan(ctx, 'enterprise');
    const ent = await service.getUsage(ctx);
    expect(ent.usage.variants).toEqual({ used: 1200, limit: null }); // unlimited
    expect(ent.usage.locations).toEqual({ used: 3, limit: null });
  });

  it('is tenant-isolated (another tenant sees zero usage on the free default)', async () => {
    const { service } = make();
    await service.changePlan(ctx, 'growth');
    const other = await service.getUsage(otherTenant);
    expect(other).toEqual({
      planId: 'free',
      usage: { variants: { used: 0, limit: 50 }, locations: { used: 0, limit: 1 } },
    });
  });
});

describe('BillingQuery.getEntitlements', () => {
  it('returns free limits by default and the active plan limits after a change', async () => {
    const { service, query } = make();
    expect(await query.getEntitlements('org-1')).toEqual({ maxVariants: 50, maxLocations: 1 });
    await service.changePlan(ctx, 'growth');
    expect(await query.getEntitlements('org-1')).toEqual({ maxVariants: 25000, maxLocations: 25 });
  });
});
