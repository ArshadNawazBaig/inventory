import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { COUNTER_MODEL, CounterSchema, MongoCounters, type CounterDoc } from '../../../../common/persistence';
import type { PurchaseOrderEntity } from '../../domain/entities';
import { MongoPurchaseOrderRepository } from './mongo.repository';
import { PURCHASE_ORDER_MODEL, PurchaseOrderSchema, type PurchaseOrderDoc } from './schemas';

const ORG = 'org-1';
let mem: MongoMemoryServer;
let poModel: Model<PurchaseOrderDoc>;
let counterModel: Model<CounterDoc>;
let repo: MongoPurchaseOrderRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function po(over: Partial<PurchaseOrderEntity> = {}): PurchaseOrderEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    poNumber: 'PO-0001',
    supplierId: oid(),
    supplierName: 'Acme',
    warehouseId: oid(),
    currency: 'USD',
    status: 'draft',
    expectedAt: null,
    note: null,
    lines: [
      { id: oid(), variantId: oid(), skuSnapshot: 'W-1', nameSnapshot: 'Widget', orderedQty: 3, receivedQty: 0, unitCostMinor: 100 },
    ],
    totals: { subtotalMinor: 300, taxMinor: 0, totalMinor: 300 },
    createdAt: at,
    updatedAt: at,
    createdBy: null,
    updatedBy: null,
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  poModel = mongoose.model<PurchaseOrderDoc>(PURCHASE_ORDER_MODEL, PurchaseOrderSchema);
  counterModel = mongoose.model<CounterDoc>(COUNTER_MODEL, CounterSchema);
  repo = new MongoPurchaseOrderRepository(poModel, new MongoCounters(counterModel));
}, 60_000);

afterEach(async () => {
  await poModel.deleteMany({});
  await counterModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoPurchaseOrderRepository', () => {
  it('persists and reads back a PO (embedded lines + totals intact)', async () => {
    const order = po();
    await repo.insert(order);
    expect(await repo.findById(ORG, order.id)).toEqual(order);
  });

  it('mints per-tenant PO sequences atomically from the counters collection', async () => {
    expect(await repo.nextNumber(ORG)).toBe('PO-0001');
    expect(await repo.nextNumber(ORG)).toBe('PO-0002');
    expect(await repo.nextNumber(ORG)).toBe('PO-0003');
    expect(await repo.nextNumber('org-2')).toBe('PO-0001'); // independent per tenant
  });

  it('updates within the tenant and is null for a miss / other tenant', async () => {
    const order = po({ status: 'draft' });
    await repo.insert(order);
    const updated = await repo.update(ORG, order.id, { status: 'submitted', updatedBy: 'user-1' });
    expect(updated).toMatchObject({ id: order.id, status: 'submitted', updatedBy: 'user-1' });
    expect(await repo.update('org-2', order.id, { status: 'cancelled' })).toBeNull();
  });

  it('lists with filters, sort and pagination', async () => {
    const supplierA = oid();
    await repo.insert(po({ poNumber: 'PO-0001', status: 'draft', supplierId: supplierA, createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await repo.insert(po({ poNumber: 'PO-0002', status: 'submitted', supplierId: supplierA, createdAt: new Date('2026-01-02T00:00:00.000Z') }));
    await repo.insert(po({ poNumber: 'PO-0003', status: 'submitted', supplierId: oid(), createdAt: new Date('2026-01-03T00:00:00.000Z') }));

    const recent = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt' });
    expect(recent.total).toBe(3);
    expect(recent.items.map((o) => o.poNumber)).toEqual(['PO-0003', 'PO-0002', 'PO-0001']);

    const submitted = await repo.list(ORG, { page: 1, limit: 10, sort: 'poNumber', status: 'submitted' });
    expect(submitted.items.map((o) => o.poNumber)).toEqual(['PO-0002', 'PO-0003']);

    const bySupplier = await repo.list(ORG, { page: 1, limit: 10, sort: 'poNumber', supplierId: supplierA });
    expect(bySupplier.total).toBe(2);

    const search = await repo.list(ORG, { page: 1, limit: 10, sort: 'poNumber', q: 'PO-0003' });
    expect(search.items.map((o) => o.poNumber)).toEqual(['PO-0003']);
  });

  it('tallies orders by status (tenant-scoped)', async () => {
    await repo.insert(po({ status: 'draft' }));
    await repo.insert(po({ status: 'draft' }));
    await repo.insert(po({ status: 'received' }));
    await repo.insert(po({ organizationId: 'org-2', status: 'draft' }));
    expect(await repo.countByStatus(ORG)).toEqual({ draft: 2, received: 1 });
  });
});
