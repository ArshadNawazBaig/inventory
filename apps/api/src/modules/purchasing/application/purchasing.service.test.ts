import { describe, it, expect, beforeEach } from 'vitest';
import type { PurchaseOrderListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import { ResourceNotFoundError, type ResourceClock, type ResourceIdGenerator } from '../../../common/resource';
import { InMemoryPurchaseOrderRepository } from '../infrastructure/in-memory.repository';
import {
  InvalidPurchaseLineError,
  InvalidPurchaseWarehouseError,
  InvalidReceiveLocationError,
  InvalidSupplierError,
  OverReceiveError,
  PurchaseOrderStateError,
} from '../domain/purchasing.errors';
import type {
  CatalogRef,
  ReceiptPoster,
  ReceiveStockCommand,
  SupplierRef,
  VariantSnapshot,
  WarehouseLocationRef,
} from './ports';
import { PurchasingService } from './purchasing.service';

const actor: ActorContext = { organizationId: 'org-1', actorId: 'user-1' };
const otherTenant: ActorContext = { organizationId: 'org-2', actorId: 'user-2' };
const LIST: PurchaseOrderListQuery = { page: 1, limit: 20, sort: '-createdAt' };
const WH = 'a'.repeat(24);
const LOC = 'b'.repeat(24);
const V1 = 'c'.repeat(24);
const V2 = 'd'.repeat(24);
const SUP = 'e'.repeat(24);

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
    [V2, { sku: 'SKU-2', productName: 'Gadget', defaultPriceMinor: 800, currency: 'USD' }],
  ]);
  getVariantSnapshot(_org: string, variantId: string): Promise<VariantSnapshot | null> {
    return Promise.resolve(this.snapshots.get(variantId) ?? null);
  }
}
class FakeSupplier implements SupplierRef {
  exists = true;
  supplierExists(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }
  getSupplierName(): Promise<string | null> {
    return Promise.resolve('Acme Supplies');
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
class RecordingReceipts implements ReceiptPoster {
  readonly calls: ReceiveStockCommand[] = [];
  receive(_ctx: ActorContext, cmd: ReceiveStockCommand): Promise<void> {
    this.calls.push(cmd);
    return Promise.resolve();
  }
}

function make() {
  const repo = new InMemoryPurchaseOrderRepository();
  const catalog = new FakeCatalog();
  const suppliers = new FakeSupplier();
  const locations = new FakeLocations();
  const receipts = new RecordingReceipts();
  const service = new PurchasingService(
    repo,
    catalog,
    suppliers,
    locations,
    receipts,
    new SeqIds(),
    new FixedClock(),
  );
  return { repo, catalog, suppliers, locations, receipts, service };
}

const draftInput = {
  supplierId: SUP,
  warehouseId: WH,
  currency: 'USD',
  lines: [{ variantId: V1, orderedQty: 10, unitCostMinor: 100 }],
};

describe('PurchasingService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a draft PO with snapshots, totals and a PO number', async () => {
    const po = await ctx.service.create(actor, draftInput);
    expect(po.poNumber).toBe('PO-0001');
    expect(po.status).toBe('draft');
    expect(po.supplierName).toBe('Acme Supplies');
    expect(po.lines[0]?.skuSnapshot).toBe('SKU-1');
    expect(po.lines[0]?.nameSnapshot).toBe('Widget');
    expect(po.lines[0]?.receivedQty).toBe(0);
    expect(po.totals).toEqual({ subtotalMinor: 1000, taxMinor: 0, totalMinor: 1000 });
  });

  it('rejects an unknown supplier, warehouse or variant', async () => {
    ctx.suppliers.exists = false;
    await expect(ctx.service.create(actor, draftInput)).rejects.toBeInstanceOf(InvalidSupplierError);
    ctx.suppliers.exists = true;
    ctx.locations.warehouse = false;
    await expect(ctx.service.create(actor, draftInput)).rejects.toBeInstanceOf(InvalidPurchaseWarehouseError);
    ctx.locations.warehouse = true;
    await expect(
      ctx.service.create(actor, { ...draftInput, lines: [{ variantId: 'f'.repeat(24), orderedQty: 1, unitCostMinor: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidPurchaseLineError);
  });

  it('mints an incrementing per-tenant PO sequence', async () => {
    const first = await ctx.service.create(actor, draftInput);
    const second = await ctx.service.create(actor, draftInput);
    expect([first.poNumber, second.poNumber]).toEqual(['PO-0001', 'PO-0002']);
  });
});

describe('PurchasingService lifecycle', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('submits a draft and refuses to submit twice', async () => {
    const po = await ctx.service.create(actor, draftInput);
    expect((await ctx.service.submit(actor, po.id)).status).toBe('submitted');
    await expect(ctx.service.submit(actor, po.id)).rejects.toBeInstanceOf(PurchaseOrderStateError);
  });

  it('edits only drafts', async () => {
    const po = await ctx.service.create(actor, draftInput);
    const updated = await ctx.service.update(actor, po.id, {
      lines: [{ variantId: V2, orderedQty: 2, unitCostMinor: 250 }],
    });
    expect(updated.lines[0]?.skuSnapshot).toBe('SKU-2');
    expect(updated.totals.totalMinor).toBe(500);
    await ctx.service.submit(actor, po.id);
    await expect(
      ctx.service.update(actor, po.id, { note: 'late' }),
    ).rejects.toBeInstanceOf(PurchaseOrderStateError);
  });

  it('receives partially then fully, posting costed receipts and advancing status', async () => {
    const po = await ctx.service.create(actor, draftInput);
    await ctx.service.submit(actor, po.id);
    const lineId = po.lines[0]!.id;

    const partial = await ctx.service.receive(actor, po.id, {
      locationId: LOC,
      lines: [{ lineId, quantity: 4 }],
    });
    expect(partial.status).toBe('partially_received');
    expect(partial.lines[0]?.receivedQty).toBe(4);
    expect(ctx.receipts.calls[0]).toMatchObject({
      variantId: V1,
      locationId: LOC,
      quantity: 4,
      unitCostMinor: 100,
      currency: 'USD',
      refId: po.id,
      lineId,
      opKey: `po:${po.id}:${lineId}:4`,
    });

    const full = await ctx.service.receive(actor, po.id, { locationId: LOC, lines: [{ lineId, quantity: 6 }] });
    expect(full.status).toBe('received');
    expect(full.lines[0]?.receivedQty).toBe(10);
  });

  it('refuses to over-receive a line', async () => {
    const po = await ctx.service.create(actor, draftInput);
    await ctx.service.submit(actor, po.id);
    await expect(
      ctx.service.receive(actor, po.id, { locationId: LOC, lines: [{ lineId: po.lines[0]!.id, quantity: 11 }] }),
    ).rejects.toBeInstanceOf(OverReceiveError);
  });

  it('rejects receiving into a location outside the receiving warehouse', async () => {
    const po = await ctx.service.create(actor, draftInput);
    await ctx.service.submit(actor, po.id);
    ctx.locations.warehouseId = 'z'.repeat(24); // location belongs to another warehouse
    await expect(
      ctx.service.receive(actor, po.id, { locationId: LOC, lines: [{ lineId: po.lines[0]!.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(InvalidReceiveLocationError);
  });

  it('refuses to receive a draft (must be submitted first)', async () => {
    const po = await ctx.service.create(actor, draftInput);
    await expect(
      ctx.service.receive(actor, po.id, { locationId: LOC, lines: [{ lineId: po.lines[0]!.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(PurchaseOrderStateError);
  });

  it('cancels a draft but not a received order', async () => {
    const po = await ctx.service.create(actor, draftInput);
    expect((await ctx.service.cancel(actor, po.id)).status).toBe('cancelled');

    const other = await ctx.service.create(actor, draftInput);
    await ctx.service.submit(actor, other.id);
    await ctx.service.receive(actor, other.id, { locationId: LOC, lines: [{ lineId: other.lines[0]!.id, quantity: 10 }] });
    await expect(ctx.service.cancel(actor, other.id)).rejects.toBeInstanceOf(PurchaseOrderStateError);
  });

  it('isolates tenants and lists', async () => {
    const po = await ctx.service.create(actor, draftInput);
    await expect(ctx.service.get(otherTenant, po.id)).rejects.toBeInstanceOf(ResourceNotFoundError);
    const list = await ctx.service.list(actor, LIST);
    expect(list.total).toBe(1);
  });
});
