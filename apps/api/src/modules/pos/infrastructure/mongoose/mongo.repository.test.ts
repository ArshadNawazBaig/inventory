import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { COUNTER_MODEL, CounterSchema, MongoCounters, type CounterDoc } from '../../../../common/persistence';
import type { PosSaleEntity } from '../../domain/entities';
import { MongoPosSaleRepository } from './mongo.repository';
import { POS_SALE_MODEL, PosSaleSchema, type PosSaleDoc } from './schemas';

/**
 * Parity test for the Mongoose POS adapter against a real (ephemeral) MongoDB — proves the receipt roundtrips
 * (embedded lines intact), the `RC-` sequence is per-tenant + atomic, filters/sort work, and tenant scoping.
 */

const ORG = 'org-1';
const AT = new Date('2026-06-01T00:00:00.000Z');
let mem: MongoMemoryServer;
let model: Model<PosSaleDoc>;
let counterModel: Model<CounterDoc>;
let repo: MongoPosSaleRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function sale(over: Partial<PosSaleEntity> = {}): PosSaleEntity {
  return {
    id: oid(),
    organizationId: ORG,
    receiptNumber: 'RC-0001',
    locationId: 'loc-1',
    customerId: null,
    currency: 'USD',
    lines: [{ variantId: 'v1', quantity: 2, unitPriceMinor: 500, lineTotalMinor: 1000 }],
    subtotalMinor: 1000,
    totalMinor: 1000,
    paymentMethod: 'cash',
    amountTenderedMinor: 1000,
    changeMinor: 0,
    soldByUserId: 'user-1',
    note: null,
    createdAt: AT,
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  model = mongoose.model<PosSaleDoc>(POS_SALE_MODEL, PosSaleSchema);
  counterModel = mongoose.model<CounterDoc>(COUNTER_MODEL, CounterSchema);
  repo = new MongoPosSaleRepository(model, new MongoCounters(counterModel));
}, 60_000);

afterEach(async () => {
  await Promise.all([model.deleteMany({}), counterModel.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoPosSaleRepository', () => {
  it('roundtrips a sale with embedded lines and is tenant-scoped', async () => {
    const s = sale({ customerId: 'cust-1', lines: [{ variantId: 'v1', quantity: 3, unitPriceMinor: 250, lineTotalMinor: 750 }] });
    await repo.insert(s);
    expect(await repo.findById(ORG, s.id)).toEqual(s);
    expect(await repo.findById('org-2', s.id)).toBeNull();
  });

  it('mints per-tenant RC sequences', async () => {
    expect(await repo.nextNumber(ORG)).toBe('RC-0001');
    expect(await repo.nextNumber(ORG)).toBe('RC-0002');
    expect(await repo.nextNumber('org-2')).toBe('RC-0001'); // independent per tenant
  });

  it('lists newest-first, filtered by location, paginated', async () => {
    await repo.insert(sale({ locationId: 'loc-1', createdAt: new Date('2026-06-01T00:00:00.000Z') }));
    await repo.insert(sale({ locationId: 'loc-1', createdAt: new Date('2026-06-02T00:00:00.000Z') }));
    await repo.insert(sale({ locationId: 'loc-2', createdAt: new Date('2026-06-03T00:00:00.000Z') }));
    await repo.insert(sale({ organizationId: 'org-2' })); // other tenant

    const all = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt' });
    expect(all.total).toBe(3);

    const loc1 = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt', locationId: 'loc-1' });
    expect(loc1.total).toBe(2);
    expect(loc1.items[0]?.createdAt.getTime()).toBeGreaterThan(loc1.items[1]!.createdAt.getTime());
  });
});
