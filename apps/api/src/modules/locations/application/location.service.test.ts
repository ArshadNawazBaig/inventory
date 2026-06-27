import { describe, it, expect, beforeEach } from 'vitest';
import type { LocationListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  DuplicateResourceError,
  ResourceNotFoundError,
  type ResourceClock,
  type ResourceEvent,
  type ResourceEventPublisher,
  type ResourceIdGenerator,
} from '../../../common/resource';
import {
  InvalidParentLocationError,
  InvalidWarehouseError,
  LocationHasChildrenError,
} from '../domain/location.errors';
import {
  InMemoryLocationRepository,
  InMemoryWarehouseRepository,
} from '../infrastructure/in-memory.repositories';
import { LocationService } from './location.service';
import { WarehouseService } from './warehouse.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: LocationListQuery = { page: 1, limit: 50, sort: 'path' };

class SeqIds implements ResourceIdGenerator {
  constructor(private readonly prefix: string) {}
  private n = 0;
  generate(): string {
    return `${this.prefix}-${++this.n}`;
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
  const warehouseRepo = new InMemoryWarehouseRepository();
  const locationRepo = new InMemoryLocationRepository();
  const events = new RecordingEvents();
  const clock = new FixedClock();
  const warehouses = new WarehouseService(warehouseRepo, new SeqIds('wh'), clock, events);
  const locations = new LocationService(locationRepo, warehouseRepo, new SeqIds('loc'), clock, events);
  return { warehouseRepo, locationRepo, events, warehouses, locations };
}

describe('LocationService', () => {
  let ctx: ReturnType<typeof make>;
  let warehouseId: string;
  beforeEach(async () => {
    ctx = make();
    warehouseId = (await ctx.warehouses.create(actor, { name: 'Main DC', code: 'WH-MAIN' })).id;
  });

  it('creates a root location and materializes its path from the code', async () => {
    const zone = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Zone A',
      code: 'A',
      type: 'zone',
    });
    expect(zone.parentLocationId).toBeNull();
    expect(zone.path).toBe('A');
    expect(ctx.events.events).toContainEqual(
      expect.objectContaining({ resource: 'location', action: 'created' }),
    );
  });

  it('nests children and builds a slash-joined path', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    const aisle = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      parentLocationId: zone.id,
    });
    const bin = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Bin 1',
      code: 'BIN1',
      type: 'bin',
      parentLocationId: aisle.id,
    });
    expect(aisle.path).toBe('A/A1');
    expect(bin.path).toBe('A/A1/BIN1');
  });

  it('rejects an unknown warehouse', async () => {
    await expect(
      ctx.locations.create(actor, { warehouseId: 'f'.repeat(24), name: 'X', code: 'X', type: 'zone' }),
    ).rejects.toBeInstanceOf(InvalidWarehouseError);
  });

  it('enforces code uniqueness within a warehouse but not across warehouses', async () => {
    await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    await expect(
      ctx.locations.create(actor, { warehouseId, name: 'Dup', code: 'a', type: 'zone' }),
    ).rejects.toBeInstanceOf(DuplicateResourceError);

    const other = await ctx.warehouses.create(actor, { name: 'Second', code: 'WH-2' });
    await expect(
      ctx.locations.create(actor, { warehouseId: other.id, name: 'Zone A', code: 'A', type: 'zone' }),
    ).resolves.toBeDefined();
  });

  it('validates the parent: must exist, same warehouse, not self, no cycle', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    const aisle = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      parentLocationId: zone.id,
    });

    // Missing parent.
    await expect(
      ctx.locations.create(actor, { warehouseId, name: 'X', code: 'X', type: 'bin', parentLocationId: 'f'.repeat(24) }),
    ).rejects.toBeInstanceOf(InvalidParentLocationError);

    // Parent in another warehouse.
    const other = await ctx.warehouses.create(actor, { name: 'Second', code: 'WH-2' });
    const otherZone = await ctx.locations.create(actor, {
      warehouseId: other.id,
      name: 'Zone X',
      code: 'X',
      type: 'zone',
    });
    await expect(
      ctx.locations.create(actor, { warehouseId, name: 'Y', code: 'Y', type: 'bin', parentLocationId: otherZone.id }),
    ).rejects.toBeInstanceOf(InvalidParentLocationError);

    // Self-parent and cycle.
    await expect(
      ctx.locations.update(actor, aisle.id, { parentLocationId: aisle.id }),
    ).rejects.toBeInstanceOf(InvalidParentLocationError);
    await expect(
      ctx.locations.update(actor, zone.id, { parentLocationId: aisle.id }),
    ).rejects.toBeInstanceOf(InvalidParentLocationError);
  });

  it('re-materializes descendant paths when an ancestor code changes', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    const aisle = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      parentLocationId: zone.id,
    });
    const bin = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Bin 1',
      code: 'BIN1',
      type: 'bin',
      parentLocationId: aisle.id,
    });

    await ctx.locations.update(actor, zone.id, { code: 'Z' });
    expect((await ctx.locations.get(actor, zone.id)).path).toBe('Z');
    expect((await ctx.locations.get(actor, aisle.id)).path).toBe('Z/A1');
    expect((await ctx.locations.get(actor, bin.id)).path).toBe('Z/A1/BIN1');
  });

  it('refuses to delete a location that has live children, then allows it once empty', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    const aisle = await ctx.locations.create(actor, {
      warehouseId,
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      parentLocationId: zone.id,
    });

    await expect(ctx.locations.remove(actor, zone.id)).rejects.toBeInstanceOf(LocationHasChildrenError);
    await ctx.locations.remove(actor, aisle.id);
    await expect(ctx.locations.remove(actor, zone.id)).resolves.toBeUndefined();
    await expect(ctx.locations.get(actor, zone.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('archives and restores (re-checking code in the warehouse)', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    expect((await ctx.locations.archive(actor, zone.id)).status).toBe('archived');
    expect((await ctx.locations.restore(actor, zone.id)).status).toBe('active');
  });

  it('isolates tenants', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    await expect(ctx.locations.get(otherTenant, zone.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('lists locations scoped to a warehouse, ordered by path', async () => {
    const zone = await ctx.locations.create(actor, { warehouseId, name: 'Zone A', code: 'A', type: 'zone' });
    await ctx.locations.create(actor, {
      warehouseId,
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      parentLocationId: zone.id,
    });
    const other = await ctx.warehouses.create(actor, { name: 'Second', code: 'WH-2' });
    await ctx.locations.create(actor, { warehouseId: other.id, name: 'Zone X', code: 'X', type: 'zone' });

    const scoped = await ctx.locations.list(actor, { ...LIST, warehouseId });
    expect(scoped.total).toBe(2);
    expect(scoped.items.map((l) => l.path)).toEqual(['A', 'A/A1']);
  });
});
