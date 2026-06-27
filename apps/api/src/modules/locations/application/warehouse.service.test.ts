import { describe, it, expect, beforeEach } from 'vitest';
import type { LookupListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateResourceError,
  ResourceNotFoundError,
  type ResourceClock,
  type ResourceEvent,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../../common/resource';
import { InMemoryWarehouseRepository } from '../infrastructure/in-memory.repositories';
import { WarehouseService } from './warehouse.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: LookupListQuery = { page: 1, limit: 20, sort: 'name' };

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `wh-${++this.n}`;
  }
}
class FixedClock implements ResourceClock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class RecordingEvents implements ResourceEventPublisher {
  readonly events: ResourceEvent[] = [];
  publish(event: ResourceEvent): void {
    this.events.push(event);
  }
}

function make() {
  const repo = new InMemoryWarehouseRepository();
  const events = new RecordingEvents();
  return { repo, events, service: new WarehouseService(repo, new SeqIds(), new FixedClock(), events) };
}

describe('WarehouseService', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a warehouse with code + address and emits an event', async () => {
    const created = await ctx.service.create(actor, {
      name: 'Main DC',
      code: 'WH-MAIN',
      address: { line1: '1 Dock Rd', city: 'Ogdenville', country: 'us' },
    });
    expect(created.code).toBe('WH-MAIN');
    expect(created.address?.city).toBe('Ogdenville');
    expect(created.address?.country).toBe('US'); // upper-cased
    expect(created.isDefault).toBe(false);
    expect(ctx.events.events).toContainEqual(
      expect.objectContaining({ resource: 'warehouse', action: 'created' }),
    );
  });

  it('does NOT require unique names but rejects a duplicate code (case-insensitive)', async () => {
    await ctx.service.create(actor, { name: 'Acme', code: 'WH1' });
    await expect(ctx.service.create(actor, { name: 'Acme' })).resolves.toBeDefined();
    await expect(ctx.service.create(actor, { name: 'Acme 2', code: 'wh1' })).rejects.toBeInstanceOf(
      DuplicateResourceError,
    );
  });

  it('keeps at most one default warehouse — promoting one demotes the previous', async () => {
    const first = await ctx.service.create(actor, { name: 'First', isDefault: true });
    const second = await ctx.service.create(actor, { name: 'Second', isDefault: true });
    expect((await ctx.service.get(actor, first.id)).isDefault).toBe(false);
    expect((await ctx.service.get(actor, second.id)).isDefault).toBe(true);

    // Promote the first via update; the second is demoted.
    await ctx.service.update(actor, first.id, { isDefault: true });
    expect((await ctx.service.get(actor, first.id)).isDefault).toBe(true);
    expect((await ctx.service.get(actor, second.id)).isDefault).toBe(false);
  });

  it('isolates tenants (code free in another tenant; cross-tenant get is 404)', async () => {
    const created = await ctx.service.create(actor, { name: 'Acme', code: 'WH1' });
    await expect(ctx.service.get(otherTenant, created.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(ctx.service.create(otherTenant, { name: 'Acme', code: 'WH1' })).resolves.toBeDefined();
  });

  it('archives, restores (re-checking code), and soft-deletes', async () => {
    const created = await ctx.service.create(actor, { name: 'Acme', code: 'WH1' });
    expect((await ctx.service.archive(actor, created.id)).status).toBe('archived');
    expect((await ctx.service.restore(actor, created.id)).status).toBe('active');

    await ctx.service.remove(actor, created.id);
    await expect(ctx.service.get(actor, created.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    // Soft delete frees the code for reuse.
    await expect(ctx.service.create(actor, { name: 'Acme 2', code: 'WH1' })).resolves.toBeDefined();
  });

  it('lists tenant warehouses sorted by name', async () => {
    await ctx.service.create(actor, { name: 'Beta' });
    await ctx.service.create(actor, { name: 'Alpha' });
    const result = await ctx.service.list(actor, LIST);
    expect(result.total).toBe(2);
    expect(result.items[0]?.name).toBe('Alpha');
  });
});
