import { describe, it, expect, beforeEach } from 'vitest';
import type { AuditLogListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { AuditRecordInput } from '../../../common/audit/audit-recorder';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemoryAuditLogRepository } from '../infrastructure/in-memory.repository';
import { AuditService } from './audit.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: AuditLogListQuery = { page: 1, limit: 20, sort: '-createdAt' };

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
/** Returns successive days so date-range filters + ordering are exercised deterministically. */
class SteppingClock implements ResourceClock {
  private day = 1;
  now(): Date {
    return new Date(`2026-02-${String(this.day++).padStart(2, '0')}T00:00:00.000Z`);
  }
}

const META = { ip: '127.0.0.1', userAgent: 'vitest', requestId: 'req-1', method: 'POST', path: '/x', statusCode: 201 };
function input(over: Partial<AuditRecordInput>): AuditRecordInput {
  return {
    organizationId: 'org-1',
    actorId: 'user-1',
    actorType: 'user',
    action: 'product.created',
    entityType: 'product',
    entityId: 'p-1',
    metadata: META,
    ...over,
  };
}

function make() {
  const repo = new InMemoryAuditLogRepository();
  const service = new AuditService(repo, new SeqIds(), new SteppingClock());
  return { repo, service };
}

describe('AuditService.record', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('appends an entry with id, timestamp and metadata that the viewer can read back', async () => {
    await ctx.service.record(input({ action: 'purchase_order.received', entityType: 'purchase_order', entityId: 'po-1' }));
    const list = await ctx.service.list(actor, LIST);
    expect(list.total).toBe(1);
    const entry = list.items[0]!;
    expect(entry.action).toBe('purchase_order.received');
    expect(entry.entityId).toBe('po-1');
    expect(entry.actorType).toBe('user');
    expect(entry.metadata.requestId).toBe('req-1');
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it('defaults before/after to null when not supplied', async () => {
    await ctx.service.record(input({}));
    const entry = (await ctx.service.list(actor, LIST)).items[0]!;
    expect(entry.before).toBeNull();
    expect(entry.after).toBeNull();
  });
});

describe('AuditService querying', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(async () => {
    ctx = make();
    await ctx.service.record(input({ action: 'product.created', entityType: 'product', entityId: 'p-1' })); // day 01
    await ctx.service.record(input({ action: 'product.updated', entityType: 'product', entityId: 'p-1' })); // day 02
    await ctx.service.record(input({ action: 'supplier.created', entityType: 'supplier', entityId: 's-1', actorId: 'user-9' })); // day 03
  });

  it('filters by action, entityType, entityId and actorId', async () => {
    expect((await ctx.service.list(actor, { ...LIST, action: 'product.updated' })).total).toBe(1);
    expect((await ctx.service.list(actor, { ...LIST, entityType: 'product' })).total).toBe(2);
    expect((await ctx.service.list(actor, { ...LIST, entityId: 's-1' })).total).toBe(1);
    expect((await ctx.service.list(actor, { ...LIST, actorId: 'user-9' })).total).toBe(1);
  });

  it('filters by an inclusive created-at range', async () => {
    const within = await ctx.service.list(actor, { ...LIST, from: '2026-02-02', to: '2026-02-03' });
    expect(within.total).toBe(2);
    expect(within.items.map((e) => e.action)).not.toContain('product.created'); // day 01 excluded
  });

  it('sorts newest-first by default', async () => {
    const list = await ctx.service.list(actor, LIST);
    expect(list.items.map((e) => e.action)).toEqual(['supplier.created', 'product.updated', 'product.created']);
  });

  it('isolates tenants on both list and get', async () => {
    expect((await ctx.service.list(otherTenant, LIST)).total).toBe(0);
    const mine = (await ctx.service.list(actor, LIST)).items[0]!;
    await expect(ctx.service.get(otherTenant, mine.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect((await ctx.service.get(actor, mine.id)).id).toBe(mine.id);
  });

  it('throws for an unknown id', async () => {
    await expect(ctx.service.get(actor, 'nope')).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
