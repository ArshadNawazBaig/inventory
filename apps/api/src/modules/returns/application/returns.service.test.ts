import { describe, it, expect, beforeEach } from 'vitest';
import type { ReturnListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemoryReturnRepository } from '../infrastructure/in-memory.repository';
import {
  InvalidReturnLineError,
  InvalidReturnLocationError,
  InvalidReturnPartyError,
  ReturnStateError,
} from '../domain/returns.errors';
import type {
  CatalogRef,
  LocationRef,
  PartyRef,
  ReturnPoster,
  ReturnStockCommand,
  VariantSnapshot,
} from './ports';
import { ReturnsService } from './returns.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: ReturnListQuery = { page: 1, limit: 20, sort: '-createdAt' };
const LOC = 'a'.repeat(24);
const V1 = 'c'.repeat(24);
const CUST = 'e'.repeat(24);
const SUP = 'f'.repeat(24);

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class FixedClock implements ResourceClock {
  now(): Date {
    return new Date('2026-01-01T00:00:00.000Z');
  }
}
class FakeCatalog implements CatalogRef {
  readonly snapshots = new Map<string, VariantSnapshot>([
    [V1, { sku: 'SKU-1', productName: 'Widget', defaultPriceMinor: 500, currency: 'USD' }],
  ]);
  getVariantSnapshot(_org: string, variantId: string): Promise<VariantSnapshot | null> {
    return Promise.resolve(this.snapshots.get(variantId) ?? null);
  }
}
class FakeParties implements PartyRef {
  customer = true;
  supplier = true;
  supplierExists(): Promise<boolean> {
    return Promise.resolve(this.supplier);
  }
  customerExists(): Promise<boolean> {
    return Promise.resolve(this.customer);
  }
  getSupplierName(): Promise<string | null> {
    return Promise.resolve('Acme Supplies');
  }
  getCustomerName(): Promise<string | null> {
    return Promise.resolve('Globex');
  }
}
class FakeLocations implements LocationRef {
  exists = true;
  locationExists(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }
}
class RecordingPoster implements ReturnPoster {
  readonly inbound: ReturnStockCommand[] = [];
  readonly outbound: ReturnStockCommand[] = [];
  returnInbound(_ctx: ActorContext, cmd: ReturnStockCommand): Promise<void> {
    this.inbound.push(cmd);
    return Promise.resolve();
  }
  returnOutbound(_ctx: ActorContext, cmd: ReturnStockCommand): Promise<void> {
    this.outbound.push(cmd);
    return Promise.resolve();
  }
}

function make() {
  const repo = new InMemoryReturnRepository();
  const catalog = new FakeCatalog();
  const parties = new FakeParties();
  const locations = new FakeLocations();
  const poster = new RecordingPoster();
  const service = new ReturnsService(repo, catalog, parties, locations, poster, new SeqIds(), new FixedClock());
  return { repo, catalog, parties, locations, poster, service };
}

const customerReturn = {
  kind: 'customer' as const,
  partyId: CUST,
  locationId: LOC,
  lines: [{ variantId: V1, quantity: 4 }],
};
const supplierReturn = {
  kind: 'supplier' as const,
  partyId: SUP,
  locationId: LOC,
  lines: [{ variantId: V1, quantity: 3 }],
};

describe('ReturnsService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a draft customer return with snapshots, party name and a RET number', async () => {
    const ret = await ctx.service.create(actor, customerReturn);
    expect(ret.returnNumber).toBe('RET-0001');
    expect(ret.status).toBe('draft');
    expect(ret.kind).toBe('customer');
    expect(ret.partyName).toBe('Globex');
    expect(ret.lines[0]?.skuSnapshot).toBe('SKU-1');
  });

  it('validates the party against its kind (customer vs supplier)', async () => {
    ctx.parties.customer = false;
    await expect(ctx.service.create(actor, customerReturn)).rejects.toBeInstanceOf(InvalidReturnPartyError);
    ctx.parties.customer = true;
    ctx.parties.supplier = false;
    await expect(ctx.service.create(actor, supplierReturn)).rejects.toBeInstanceOf(InvalidReturnPartyError);
  });

  it('rejects an unknown location or variant', async () => {
    ctx.locations.exists = false;
    await expect(ctx.service.create(actor, customerReturn)).rejects.toBeInstanceOf(InvalidReturnLocationError);
    ctx.locations.exists = true;
    await expect(
      ctx.service.create(actor, { ...customerReturn, lines: [{ variantId: 'd'.repeat(24), quantity: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidReturnLineError);
  });

  it('mints an incrementing per-tenant RET sequence', async () => {
    const first = await ctx.service.create(actor, customerReturn);
    const second = await ctx.service.create(actor, supplierReturn);
    expect([first.returnNumber, second.returnNumber]).toEqual(['RET-0001', 'RET-0002']);
  });
});

describe('ReturnsService lifecycle', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('completing a customer return posts return_in into the location', async () => {
    const ret = await ctx.service.create(actor, customerReturn);
    const lineId = ret.lines[0]!.id;
    const done = await ctx.service.complete(actor, ret.id);
    expect(done.status).toBe('completed');
    expect(ctx.poster.inbound[0]).toMatchObject({
      variantId: V1,
      locationId: LOC,
      quantity: 4,
      refId: ret.id,
      lineId,
      opKey: `return:${ret.id}:${lineId}`,
    });
    expect(ctx.poster.outbound).toHaveLength(0);
  });

  it('completing a supplier return posts return_out from the location', async () => {
    const ret = await ctx.service.create(actor, supplierReturn);
    const done = await ctx.service.complete(actor, ret.id);
    expect(done.status).toBe('completed');
    expect(ctx.poster.outbound[0]).toMatchObject({ variantId: V1, locationId: LOC, quantity: 3 });
    expect(ctx.poster.inbound).toHaveLength(0);
  });

  it('refuses to complete or edit anything but a draft', async () => {
    const ret = await ctx.service.create(actor, customerReturn);
    await ctx.service.complete(actor, ret.id);
    await expect(ctx.service.complete(actor, ret.id)).rejects.toBeInstanceOf(ReturnStateError);
    await expect(ctx.service.update(actor, ret.id, { note: 'late' })).rejects.toBeInstanceOf(ReturnStateError);
  });

  it('edits a draft and cancels a draft', async () => {
    const ret = await ctx.service.create(actor, customerReturn);
    const updated = await ctx.service.update(actor, ret.id, { lines: [{ variantId: V1, quantity: 9 }] });
    expect(updated.lines[0]?.quantity).toBe(9);
    expect((await ctx.service.cancel(actor, ret.id)).status).toBe('cancelled');
  });

  it('isolates tenants and lists', async () => {
    const ret = await ctx.service.create(actor, customerReturn);
    await expect(ctx.service.get(otherTenant, ret.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    const list = await ctx.service.list(actor, LIST);
    expect(list.total).toBe(1);
  });
});
