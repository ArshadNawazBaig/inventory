import { describe, it, expect } from 'vitest';
import type { SalesOrderRepository } from './ports';
import { SalesQuery } from './sales-query.service';

/** Minimal repo fake — only `countByStatus` is exercised; the rest are never called. */
class FakeRepo implements SalesOrderRepository {
  constructor(private readonly orders: Array<{ organizationId: string; status: string }>) {}
  countByStatus(organizationId: string): Promise<Record<string, number>> {
    const tally: Record<string, number> = {};
    for (const o of this.orders) {
      if (o.organizationId !== organizationId) continue;
      tally[o.status] = (tally[o.status] ?? 0) + 1;
    }
    return Promise.resolve(tally);
  }
  insert(): never { throw new Error('not used'); }
  findById(): never { throw new Error('not used'); }
  update(): never { throw new Error('not used'); }
  list(): never { throw new Error('not used'); }
  nextNumber(): never { throw new Error('not used'); }
}

describe('SalesQuery.countByStatus', () => {
  it('returns the complete status set (0 for absent) scoped to the tenant', async () => {
    const repo = new FakeRepo([
      { organizationId: 'org-1', status: 'confirmed' },
      { organizationId: 'org-1', status: 'fulfilled' },
      { organizationId: 'org-2', status: 'draft' }, // other tenant — ignored
    ]);
    expect(await new SalesQuery(repo).countByStatus('org-1')).toEqual([
      { status: 'draft', count: 0 },
      { status: 'confirmed', count: 1 },
      { status: 'partially_fulfilled', count: 0 },
      { status: 'fulfilled', count: 1 },
      { status: 'cancelled', count: 0 },
    ]);
  });
});
