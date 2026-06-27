import { describe, it, expect } from 'vitest';
import type { TransferRepository } from './ports';
import { TransfersQuery } from './transfers-query.service';

/** Minimal repo fake — only `countByStatus` is exercised; the rest are never called. */
class FakeRepo implements TransferRepository {
  constructor(private readonly transfers: Array<{ organizationId: string; status: string }>) {}
  countByStatus(organizationId: string): Promise<Record<string, number>> {
    const tally: Record<string, number> = {};
    for (const t of this.transfers) {
      if (t.organizationId !== organizationId) continue;
      tally[t.status] = (tally[t.status] ?? 0) + 1;
    }
    return Promise.resolve(tally);
  }
  insert(): never { throw new Error('not used'); }
  findById(): never { throw new Error('not used'); }
  update(): never { throw new Error('not used'); }
  list(): never { throw new Error('not used'); }
  nextNumber(): never { throw new Error('not used'); }
}

describe('TransfersQuery.countByStatus', () => {
  it('returns the complete status set (0 for absent) scoped to the tenant', async () => {
    const repo = new FakeRepo([
      { organizationId: 'org-1', status: 'in_transit' },
      { organizationId: 'org-1', status: 'in_transit' },
      { organizationId: 'org-1', status: 'completed' },
      { organizationId: 'org-2', status: 'draft' }, // other tenant — ignored
    ]);
    expect(await new TransfersQuery(repo).countByStatus('org-1')).toEqual([
      { status: 'draft', count: 0 },
      { status: 'in_transit', count: 2 },
      { status: 'partially_received', count: 0 },
      { status: 'completed', count: 1 },
      { status: 'cancelled', count: 0 },
    ]);
  });
});
