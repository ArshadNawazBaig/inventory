import { describe, it, expect, beforeEach } from 'vitest';
import type { StockLevelListQuery, StockMovementListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import {
  InMemoryStockLevelRepository,
  InMemoryStockMovementRepository,
} from '../infrastructure/in-memory.repositories';
import { InMemoryLedgerWriter } from '../infrastructure/adapters';
import type {
  InventoryClock,
  InventoryEventPublisher,
  InventoryIdGenerator,
  InventoryPolicyPort,
  InventoryReferencePort,
} from './ports';
import type { InventoryEvent } from '../domain/entities';
import {
  InsufficientStockError,
  InvalidStockLocationError,
  InvalidVariantError,
  ZeroDeltaError,
} from '../domain/inventory.errors';
import { InventoryService } from './inventory.service';
import { InventoryQuery } from './inventory-query.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const V1 = 'variant-1';
const V2 = 'variant-2';
const L1 = 'location-1';
const L2 = 'location-2';
const LEVELS: StockLevelListQuery = { page: 1, limit: 50, sort: '-updatedAt' };
const MOVES: StockMovementListQuery = { page: 1, limit: 50, sort: '-createdAt' };

class SeqIds implements InventoryIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class FixedClock implements InventoryClock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class RecordingEvents implements InventoryEventPublisher {
  readonly events: InventoryEvent[] = [];
  publish(event: InventoryEvent): void {
    this.events.push(event);
  }
}
class FakeReferences implements InventoryReferencePort {
  variant = true;
  location = true;
  variantExists(): Promise<boolean> {
    return Promise.resolve(this.variant);
  }
  locationExists(): Promise<boolean> {
    return Promise.resolve(this.location);
  }
}
class FakePolicy implements InventoryPolicyPort {
  allow = false;
  allowNegativeStock(): Promise<boolean> {
    return Promise.resolve(this.allow);
  }
}

function make() {
  const movements = new InMemoryStockMovementRepository();
  const levels = new InMemoryStockLevelRepository();
  const references = new FakeReferences();
  const policy = new FakePolicy();
  const events = new RecordingEvents();
  const service = new InventoryService(
    movements,
    levels,
    references,
    policy,
    new SeqIds(),
    new FixedClock(),
    events,
    new InMemoryLedgerWriter(movements, levels),
  );
  const query = new InventoryQuery(levels, movements);
  return { movements, levels, references, policy, events, service, query };
}

describe('InventoryService.adjust', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('appends an immutable movement and builds the projection (onHand = delta)', async () => {
    const { movement, level } = await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5 });
    expect(movement.type).toBe('adjustment');
    expect(movement.reason).toEqual({ kind: 'manual', refId: null, lineId: null });
    expect(movement.opKey).toBeTruthy();
    expect(level.onHand).toBe(5);
    expect(level.available).toBe(5); // onHand − reserved(0)
    expect(ctx.events.events).toContainEqual(
      expect.objectContaining({ action: 'movement.posted', delta: 5, type: 'adjustment' }),
    );
  });

  it('accumulates: onHand equals the sum of ledger deltas (reconciliation invariant)', async () => {
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 10 });
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: -3 });
    const { level } = await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 8 });
    expect(level.onHand).toBe(15);

    const ledger = await ctx.movements.listByVariantLocation('org-1', V1, L1);
    const sum = ledger.reduce((total, m) => total + m.delta, 0);
    expect(sum).toBe(level.onHand);
    expect(ledger).toHaveLength(3); // append-only
  });

  it('rejects a zero delta', async () => {
    await expect(ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 0 })).rejects.toBeInstanceOf(
      ZeroDeltaError,
    );
  });

  it('validates variant and location existence', async () => {
    ctx.references.variant = false;
    await expect(ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 1 })).rejects.toBeInstanceOf(
      InvalidVariantError,
    );
    ctx.references.variant = true;
    ctx.references.location = false;
    await expect(ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 1 })).rejects.toBeInstanceOf(
      InvalidStockLocationError,
    );
  });

  it('refuses to drive on-hand negative unless the tenant allows it', async () => {
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 3 });
    await expect(
      ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: -5 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    ctx.policy.allow = true;
    const { level } = await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: -5 });
    expect(level.onHand).toBe(-2);
  });

  it('is idempotent on opKey (re-post returns the original; on-hand not double-applied)', async () => {
    const first = await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5, opKey: 'op-1' });
    const second = await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5, opKey: 'op-1' });
    expect(second.movement.id).toBe(first.movement.id);
    expect(second.level.onHand).toBe(5);
    const ledger = await ctx.movements.listByVariantLocation('org-1', V1, L1);
    expect(ledger).toHaveLength(1);
  });

  it('recomputes weighted-average cost on costed inbound deltas', async () => {
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 10, unitCostMinor: 100, currency: 'USD' });
    const { level } = await ctx.service.adjust(actor, {
      variantId: V1,
      locationId: L1,
      delta: 10,
      unitCostMinor: 200,
      currency: 'USD',
    });
    expect(level.onHand).toBe(20);
    expect(level.avgCostMinor).toBe(150); // (10*100 + 10*200) / 20
    expect(level.currency).toBe('USD');
  });

  it('isolates tenants', async () => {
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5 });
    const mine = await ctx.service.listLevels(actor, LEVELS);
    expect(mine.total).toBe(1);
    const theirs = await ctx.service.listLevels(otherTenant, LEVELS);
    expect(theirs.total).toBe(0);
  });

  it('lists levels and movements filtered by variant', async () => {
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5 });
    await ctx.service.adjust(actor, { variantId: V2, locationId: L2, delta: 7 });
    const levels = await ctx.service.listLevels(actor, { ...LEVELS, variantId: V1 });
    expect(levels.items.map((l) => l.variantId)).toEqual([V1]);
    const moves = await ctx.service.listMovements(actor, { ...MOVES, variantId: V2 });
    expect(moves.items.map((m) => m.variantId)).toEqual([V2]);
  });
});

describe('InventoryQuery.getVariantStockSummary', () => {
  it('aggregates a variant across its locations', async () => {
    const ctx = make();
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5 });
    await ctx.service.adjust(actor, { variantId: V1, locationId: L2, delta: 8 });
    const summary = await ctx.query.getVariantStockSummary('org-1', V1);
    expect(summary).toEqual({ onHand: 13, reserved: 0, inTransit: 0, hasOpenOrders: false });
  });
});

describe('InventoryQuery.listRecentMovements', () => {
  it('returns the newest ledger entries, mapped to the feed shape, tenant-scoped', async () => {
    const ctx = make();
    await ctx.service.adjust(actor, { variantId: V1, locationId: L1, delta: 5 });
    await ctx.service.adjust(actor, { variantId: V1, locationId: L2, delta: 7 });
    const recent = await ctx.query.listRecentMovements('org-1', 10);
    expect(recent).toHaveLength(2);
    expect(recent[0]).toMatchObject({ variantId: V1, reasonKind: 'manual', type: 'adjustment' });
    expect(recent.every((m) => typeof m.id === 'string' && m.createdAt instanceof Date)).toBe(true);
    expect(await ctx.query.listRecentMovements('org-2', 10)).toEqual([]);
  });
});
