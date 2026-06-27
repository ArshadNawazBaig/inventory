import { describe, it, expect, beforeEach } from 'vitest';
import type { ActorContext } from '../../../common/auth/actor-context';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemorySalesOrderRepository } from '../infrastructure/in-memory.repository';
import {
  InvalidCustomerError,
  InvalidFulfillLocationError,
  InvalidSalesLineError,
  InvalidSalesWarehouseError,
  OverFulfillError,
  SalesOrderStateError,
} from '../domain/sales.errors';
import type {
  CatalogRef,
  CustomerRef,
  ShipmentPoster,
  ShipStockCommand,
  VariantSnapshot,
  WarehouseLocationRef,
} from './ports';
import { SalesService } from './sales.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const WH = 'a'.repeat(24);
const LOC = 'b'.repeat(24);
const V1 = 'c'.repeat(24);
const CUST = 'e'.repeat(24);

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
class FakeCustomer implements CustomerRef {
  exists = true;
  customerExists(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }
  getCustomerName(): Promise<string | null> {
    return Promise.resolve('Jane Doe');
  }
}
class FakeLocations implements WarehouseLocationRef {
  warehouse = true;
  location = true;
  warehouseId: string | null = WH;
  warehouseExists(): Promise<boolean> {
    return Promise.resolve(this.warehouse);
  }
  locationExists(): Promise<boolean> {
    return Promise.resolve(this.location);
  }
  findWarehouseId(): Promise<string | null> {
    return Promise.resolve(this.warehouseId);
  }
}
class RecordingShipments implements ShipmentPoster {
  readonly calls: ShipStockCommand[] = [];
  fail = false;
  ship(_ctx: ActorContext, cmd: ShipStockCommand): Promise<void> {
    if (this.fail) return Promise.reject(new Error('insufficient stock'));
    this.calls.push(cmd);
    return Promise.resolve();
  }
}

function make() {
  const repo = new InMemorySalesOrderRepository();
  const catalog = new FakeCatalog();
  const customers = new FakeCustomer();
  const locations = new FakeLocations();
  const shipments = new RecordingShipments();
  const service = new SalesService(
    repo,
    catalog,
    customers,
    locations,
    shipments,
    new SeqIds(),
    new FixedClock(),
  );
  return { repo, catalog, customers, locations, shipments, service };
}

const draftInput = {
  customerId: CUST,
  warehouseId: WH,
  currency: 'USD',
  lines: [{ variantId: V1, orderedQty: 10, unitPriceMinor: 500 }],
};

describe('SalesService', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a draft SO with snapshots, totals and an SO number', async () => {
    const so = await ctx.service.create(actor, draftInput);
    expect(so.soNumber).toBe('SO-0001');
    expect(so.status).toBe('draft');
    expect(so.customerName).toBe('Jane Doe');
    expect(so.lines[0]?.skuSnapshot).toBe('SKU-1');
    expect(so.lines[0]?.shippedQty).toBe(0);
    expect(so.totals).toEqual({ subtotalMinor: 5000, taxMinor: 0, totalMinor: 5000 });
  });

  it('rejects an unknown customer, warehouse or variant', async () => {
    ctx.customers.exists = false;
    await expect(ctx.service.create(actor, draftInput)).rejects.toBeInstanceOf(InvalidCustomerError);
    ctx.customers.exists = true;
    ctx.locations.warehouse = false;
    await expect(ctx.service.create(actor, draftInput)).rejects.toBeInstanceOf(InvalidSalesWarehouseError);
    ctx.locations.warehouse = true;
    await expect(
      ctx.service.create(actor, { ...draftInput, lines: [{ variantId: 'f'.repeat(24), orderedQty: 1, unitPriceMinor: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidSalesLineError);
  });

  it('confirms a draft and refuses to confirm twice', async () => {
    const so = await ctx.service.create(actor, draftInput);
    expect((await ctx.service.confirm(actor, so.id)).status).toBe('confirmed');
    await expect(ctx.service.confirm(actor, so.id)).rejects.toBeInstanceOf(SalesOrderStateError);
  });

  it('fulfils partially then fully, posting shipments and advancing status', async () => {
    const so = await ctx.service.create(actor, draftInput);
    await ctx.service.confirm(actor, so.id);
    const lineId = so.lines[0]!.id;

    const partial = await ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId, quantity: 3 }] });
    expect(partial.status).toBe('partially_fulfilled');
    expect(partial.lines[0]?.shippedQty).toBe(3);
    expect(ctx.shipments.calls[0]).toMatchObject({
      variantId: V1,
      locationId: LOC,
      quantity: 3,
      refId: so.id,
      lineId,
      opKey: `so:${so.id}:${lineId}:3`,
    });

    const full = await ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId, quantity: 7 }] });
    expect(full.status).toBe('fulfilled');
    expect(full.lines[0]?.shippedQty).toBe(10);
  });

  it('refuses to over-fulfil, ship to a foreign location, or fulfil a draft', async () => {
    const so = await ctx.service.create(actor, draftInput);
    await expect(
      ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId: so.lines[0]!.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(SalesOrderStateError); // still draft
    await ctx.service.confirm(actor, so.id);
    await expect(
      ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId: so.lines[0]!.id, quantity: 11 }] }),
    ).rejects.toBeInstanceOf(OverFulfillError);
    ctx.locations.warehouseId = 'z'.repeat(24);
    await expect(
      ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId: so.lines[0]!.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidFulfillLocationError);
  });

  it('propagates an Inventory rejection (e.g. insufficient stock) without advancing the line', async () => {
    const so = await ctx.service.create(actor, draftInput);
    await ctx.service.confirm(actor, so.id);
    ctx.shipments.fail = true;
    await expect(
      ctx.service.fulfill(actor, so.id, { locationId: LOC, lines: [{ lineId: so.lines[0]!.id, quantity: 5 }] }),
    ).rejects.toThrow();
    expect((await ctx.service.get(actor, so.id)).lines[0]?.shippedQty).toBe(0);
  });

  it('cancels a draft/confirmed but not a fulfilled order, and isolates tenants', async () => {
    const so = await ctx.service.create(actor, draftInput);
    expect((await ctx.service.cancel(actor, so.id)).status).toBe('cancelled');
    await expect(ctx.service.get(otherTenant, so.id)).rejects.toBeInstanceOf(ResourceNotFoundError);

    const other = await ctx.service.create(actor, draftInput);
    await ctx.service.confirm(actor, other.id);
    await ctx.service.fulfill(actor, other.id, { locationId: LOC, lines: [{ lineId: other.lines[0]!.id, quantity: 10 }] });
    await expect(ctx.service.cancel(actor, other.id)).rejects.toBeInstanceOf(SalesOrderStateError);
  });
});
