import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { COUNTER_MODEL, CounterSchema, MongoCounters, type CounterDoc } from '../../../../common/persistence';
import type { ReturnEntity } from '../../domain/entities';
import { MongoReturnRepository } from './mongo.repository';
import { RETURN_MODEL, ReturnSchema, type ReturnDoc } from './schemas';

const ORG = 'org-1';
let mem: MongoMemoryServer;
let retModel: Model<ReturnDoc>;
let counterModel: Model<CounterDoc>;
let repo: MongoReturnRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function ret(over: Partial<ReturnEntity> = {}): ReturnEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    returnNumber: 'RET-0001',
    kind: 'customer',
    partyId: oid(),
    partyName: 'Globex',
    locationId: oid(),
    status: 'draft',
    reason: 'changed mind',
    note: null,
    lines: [{ id: oid(), variantId: oid(), skuSnapshot: 'W-1', nameSnapshot: 'Widget', quantity: 4 }],
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
  retModel = mongoose.model<ReturnDoc>(RETURN_MODEL, ReturnSchema);
  counterModel = mongoose.model<CounterDoc>(COUNTER_MODEL, CounterSchema);
  repo = new MongoReturnRepository(retModel, new MongoCounters(counterModel));
}, 60_000);

afterEach(async () => {
  await retModel.deleteMany({});
  await counterModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoReturnRepository', () => {
  it('roundtrips a return and mints RET sequences', async () => {
    const r = ret();
    await repo.insert(r);
    expect(await repo.findById(ORG, r.id)).toEqual(r);
    expect(await repo.nextNumber(ORG)).toBe('RET-0001');
    expect(await repo.nextNumber(ORG)).toBe('RET-0002');
  });

  it('filters by kind + status, and is tenant-scoped', async () => {
    await repo.insert(ret({ returnNumber: 'RET-0001', kind: 'customer', status: 'completed' }));
    await repo.insert(ret({ returnNumber: 'RET-0002', kind: 'supplier', status: 'draft' }));
    await repo.insert(ret({ organizationId: 'org-2', kind: 'customer' }));

    const customer = await repo.list(ORG, { page: 1, limit: 10, sort: 'returnNumber', kind: 'customer' });
    expect(customer.items.map((r) => r.returnNumber)).toEqual(['RET-0001']);
    const supplier = await repo.list(ORG, { page: 1, limit: 10, sort: 'returnNumber', status: 'draft' });
    expect(supplier.items.map((r) => r.returnNumber)).toEqual(['RET-0002']);
    expect((await repo.list(ORG, { page: 1, limit: 10, sort: 'returnNumber' })).total).toBe(2); // org-2 excluded
  });
});
