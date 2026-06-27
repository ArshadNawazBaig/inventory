import { describe, it, expect, beforeEach } from 'vitest';
import type { LookupListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { LookupEvent } from '../domain/entities';
import {
  DuplicateLookupError,
  InvalidParentError,
  LookupNotFoundError,
} from '../domain/lookup.errors';
import {
  InMemoryBrandRepository,
  InMemoryCategoryRepository,
  InMemoryUnitRepository,
} from '../infrastructure/in-memory.repositories';
import type { Clock, IdGenerator, LookupEventPublisher } from './ports';
import { BrandService, CategoryService, UnitService } from './lookup.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: LookupListQuery = { page: 1, limit: 20, sort: 'name' };

class SeqIds implements IdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class FixedClock implements Clock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class RecordingEvents implements LookupEventPublisher {
  readonly events: LookupEvent[] = [];
  publish(event: LookupEvent): void {
    this.events.push(event);
  }
}

function makeCategories() {
  const repo = new InMemoryCategoryRepository();
  const events = new RecordingEvents();
  return { repo, events, service: new CategoryService(repo, new SeqIds(), new FixedClock(), events) };
}
function makeUnits() {
  const repo = new InMemoryUnitRepository();
  const events = new RecordingEvents();
  return { repo, events, service: new UnitService(repo, new SeqIds(), new FixedClock(), events) };
}
function makeBrands() {
  const repo = new InMemoryBrandRepository();
  const events = new RecordingEvents();
  return { repo, events, service: new BrandService(repo, new SeqIds(), new FixedClock(), events) };
}

describe('CategoryService', () => {
  let ctx: ReturnType<typeof makeCategories>;
  beforeEach(() => {
    ctx = makeCategories();
  });

  it('creates a category and emits an event', async () => {
    const created = await ctx.service.create(actor, { name: 'Tools' });
    expect(created.name).toBe('Tools');
    expect(created.status).toBe('active');
    expect(ctx.events.events).toContainEqual(
      expect.objectContaining({ resource: 'category', action: 'created' }),
    );
  });

  it('rejects a duplicate name (case-insensitive)', async () => {
    await ctx.service.create(actor, { name: 'Tools' });
    await expect(ctx.service.create(actor, { name: 'tools' })).rejects.toBeInstanceOf(
      DuplicateLookupError,
    );
  });

  it('isolates tenants', async () => {
    const created = await ctx.service.create(actor, { name: 'Tools' });
    await expect(ctx.service.get(otherTenant, created.id)).rejects.toBeInstanceOf(
      LookupNotFoundError,
    );
    // The same name is free in another tenant.
    await expect(ctx.service.create(otherTenant, { name: 'Tools' })).resolves.toBeDefined();
  });

  it('validates the parent: must exist, not self, no cycle', async () => {
    const parent = await ctx.service.create(actor, { name: 'Hand tools' });
    const child = await ctx.service.create(actor, { name: 'Wrenches', parentId: parent.id });
    expect(child.parentId).toBe(parent.id);

    await expect(
      ctx.service.create(actor, { name: 'Orphan', parentId: 'f'.repeat(24) }),
    ).rejects.toBeInstanceOf(InvalidParentError);

    await expect(
      ctx.service.update(actor, child.id, { parentId: child.id }),
    ).rejects.toBeInstanceOf(InvalidParentError);

    // Cycle: make the parent a child of its own descendant.
    await expect(
      ctx.service.update(actor, parent.id, { parentId: child.id }),
    ).rejects.toBeInstanceOf(InvalidParentError);
  });

  it('archives, restores, and soft-deletes', async () => {
    const created = await ctx.service.create(actor, { name: 'Tools' });
    expect((await ctx.service.archive(actor, created.id)).status).toBe('archived');
    expect((await ctx.service.restore(actor, created.id)).status).toBe('active');

    await ctx.service.remove(actor, created.id);
    await expect(ctx.service.get(actor, created.id)).rejects.toBeInstanceOf(LookupNotFoundError);

    // Soft delete frees the name for reuse.
    await expect(ctx.service.create(actor, { name: 'Tools' })).resolves.toBeDefined();
  });

  it('lists only live rows, filtered + sorted', async () => {
    await ctx.service.create(actor, { name: 'Beta' });
    const alpha = await ctx.service.create(actor, { name: 'Alpha' });
    await ctx.service.archive(actor, alpha.id);

    const all = await ctx.service.list(actor, LIST);
    expect(all.total).toBe(2);
    expect(all.items[0]?.name).toBe('Alpha'); // name asc

    const active = await ctx.service.list(actor, { ...LIST, status: 'active' });
    expect(active.items.map((c) => c.name)).toEqual(['Beta']);
  });
});

describe('UnitService', () => {
  it('enforces unique code (case-insensitive)', async () => {
    const { service } = makeUnits();
    await service.create(actor, { name: 'Kilogram', code: 'kg' });
    await expect(service.create(actor, { name: 'Kilo', code: 'KG' })).rejects.toBeInstanceOf(
      DuplicateLookupError,
    );
  });

  it('allows updating a unit without tripping its own code', async () => {
    const { service } = makeUnits();
    const unit = await service.create(actor, { name: 'Each', code: 'ea' });
    const updated = await service.update(actor, unit.id, { name: 'Each (unit)' });
    expect(updated.name).toBe('Each (unit)');
    expect(updated.code).toBe('ea');
  });
});

describe('BrandService', () => {
  it('stores an optional website', async () => {
    const { service } = makeBrands();
    const brand = await service.create(actor, { name: 'Acme', website: 'https://acme.test' });
    expect(brand.website).toBe('https://acme.test');
  });
});
