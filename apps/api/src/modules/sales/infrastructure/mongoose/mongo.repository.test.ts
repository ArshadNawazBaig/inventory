import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { COUNTER_MODEL, CounterSchema, MongoCounters, type CounterDoc } from '../../../../common/persistence';
import type { SalesOrderEntity } from '../../domain/entities';
import { MongoSalesOrderRepository } from './mongo.repository';
import { SALES_ORDER_MODEL, SalesOrderSchema, type SalesOrderDoc } from './schemas';

const ORG = 'org-1';
let mem: MongoMemoryServer;
let soModel: Model<SalesOrderDoc>;
let counterModel: Model<CounterDoc>;
let repo: MongoSalesOrderRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function so(over: Partial<SalesOrderEntity> = {}): SalesOrderEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    soNumber: 'SO-0001',
    customerId: oid(),
    customerName: 'Globex',
    warehouseId: oid(),
    currency: 'USD',
    status: 'draft',
    note: null,
    lines: [
      { id: oid(), variantId: oid(), skuSnapshot: 'W-1', nameSnapshot: 'Widget', orderedQty: 2, shippedQty: 0, unitPriceMinor: 400 },
    ],
    totals: { subtotalMinor: 800, taxMinor: 0, totalMinor: 800 },
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
  soModel = mongoose.model<SalesOrderDoc>(SALES_ORDER_MODEL, SalesOrderSchema);
  counterModel = mongoose.model<CounterDoc>(COUNTER_MODEL, CounterSchema);
  repo = new MongoSalesOrderRepository(soModel, new MongoCounters(counterModel));
}, 60_000);

afterEach(async () => {
  await soModel.deleteMany({});
  await counterModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoSalesOrderRepository', () => {
  it('roundtrips a SO and mints per-tenant SO sequences', async () => {
    const order = so();
    await repo.insert(order);
    expect(await repo.findById(ORG, order.id)).toEqual(order);
    expect(await repo.nextNumber(ORG)).toBe('SO-0001');
    expect(await repo.nextNumber(ORG)).toBe('SO-0002');
    expect(await repo.nextNumber('org-2')).toBe('SO-0001');
  });

  it('updates, filters/sorts/paginates, and tallies by status', async () => {
    const customerA = oid();
    await repo.insert(so({ soNumber: 'SO-0001', status: 'draft', customerId: customerA, createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await repo.insert(so({ soNumber: 'SO-0002', status: 'confirmed', customerId: customerA, createdAt: new Date('2026-01-02T00:00:00.000Z') }));
    await repo.insert(so({ soNumber: 'SO-0003', status: 'confirmed', customerId: oid(), createdAt: new Date('2026-01-03T00:00:00.000Z') }));

    const recent = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt' });
    expect(recent.items.map((o) => o.soNumber)).toEqual(['SO-0003', 'SO-0002', 'SO-0001']);
    expect((await repo.list(ORG, { page: 1, limit: 10, sort: 'soNumber', customerId: customerA })).total).toBe(2);

    const first = await repo.findById(ORG, recent.items[2]!.id);
    const updated = await repo.update(ORG, first!.id, { status: 'cancelled' });
    expect(updated?.status).toBe('cancelled');

    expect(await repo.countByStatus(ORG)).toEqual({ cancelled: 1, confirmed: 2 });
  });
});
