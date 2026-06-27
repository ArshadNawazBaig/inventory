import { describe, it, expect } from 'vitest';
import type { PurchaseOrderRepository } from './ports';
import { PurchasingQuery } from './purchasing-query.service';

/** Minimal repo fake — only `countByStatus` is exercised; the rest are never called. */
class FakeRepo implements PurchaseOrderRepository {
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

describe('PurchasingQuery.countByStatus', () => {
  it('returns the complete status set (0 for absent) scoped to the tenant', async () => {
    const repo = new FakeRepo([
      { organizationId: 'org-1', status: 'draft' },
      { organizationId: 'org-1', status: 'draft' },
      { organizationId: 'org-1', status: 'received' },
      { organizationId: 'org-2', status: 'submitted' }, // other tenant — ignored
    ]);
    expect(await new PurchasingQuery(repo).countByStatus('org-1')).toEqual([
      { status: 'draft', count: 2 },
      { status: 'submitted', count: 0 },
      { status: 'partially_received', count: 0 },
      { status: 'received', count: 1 },
      { status: 'cancelled', count: 0 },
    ]);
  });
});
