import { describe, it, expect } from 'vitest';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ResourceClock } from '../../../common/resource';
import { InMemoryOrganizationSettingsRepository } from '../infrastructure/in-memory.repository';
import { SettingsService } from './settings.service';
import { SettingsQuery } from './settings-query.service';

const ctx: ActorContext = { organizationId: 'org-1', actorId: 'user-ann' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-bob' };
const AT = new Date('2026-06-28T09:00:00.000Z');

class FixedClock implements ResourceClock {
  now(): Date {
    return AT;
  }
}

function make() {
  const repo = new InMemoryOrganizationSettingsRepository();
  return { repo, service: new SettingsService(repo, new FixedClock()), query: new SettingsQuery(repo) };
}

describe('SettingsService', () => {
  it('returns safe defaults (unpersisted) when the tenant has never saved', async () => {
    const settings = await make().service.get(ctx);
    expect(settings).toMatchObject({
      organizationId: 'org-1',
      defaultCurrency: 'USD',
      timezone: 'UTC',
      allowNegativeStock: false,
      lowStockAlertsEnabled: true,
      createdAt: null,
      updatedAt: null,
      updatedBy: null,
    });
  });

  it('does not persist on a read', async () => {
    const { repo, service } = make();
    await service.get(ctx);
    expect(await repo.findByOrg('org-1')).toBeNull();
  });

  it('merges a partial patch, stamps updatedAt/updatedBy, and persists', async () => {
    const { service } = make();
    const saved = await service.update(ctx, { allowNegativeStock: true, defaultCurrency: 'EUR' });
    expect(saved).toMatchObject({
      defaultCurrency: 'EUR',
      allowNegativeStock: true,
      timezone: 'UTC', // untouched default preserved
      lowStockAlertsEnabled: true,
      updatedBy: 'user-ann',
    });
    expect(saved.updatedAt).toEqual(AT);
    expect(saved.createdAt).toEqual(AT);
    const reread = await service.get(ctx);
    expect(reread.defaultCurrency).toBe('EUR');
    expect(reread.allowNegativeStock).toBe(true);
  });

  it('preserves earlier fields across successive partial updates', async () => {
    const { service } = make();
    await service.update(ctx, { defaultCurrency: 'GBP' });
    const second = await service.update(ctx, { timezone: 'Europe/London' });
    expect(second).toMatchObject({ defaultCurrency: 'GBP', timezone: 'Europe/London' });
  });

  it('is tenant-isolated', async () => {
    const { service } = make();
    await service.update(ctx, { allowNegativeStock: true });
    const other = await service.get(otherTenant);
    expect(other.allowNegativeStock).toBe(false);
    expect(other.updatedAt).toBeNull();
  });
});

describe('SettingsQuery.allowNegativeStock', () => {
  it('defaults to false when unset and reflects the saved value', async () => {
    const { service, query } = make();
    expect(await query.allowNegativeStock('org-1')).toBe(false);
    await service.update(ctx, { allowNegativeStock: true });
    expect(await query.allowNegativeStock('org-1')).toBe(true);
    expect(await query.allowNegativeStock('org-2')).toBe(false); // other tenant unaffected
  });
});
