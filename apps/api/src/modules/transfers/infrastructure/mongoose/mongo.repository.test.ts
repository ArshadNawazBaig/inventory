import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { COUNTER_MODEL, CounterSchema, MongoCounters, type CounterDoc } from '../../../../common/persistence';
import type { TransferEntity } from '../../domain/entities';
import { MongoTransferRepository } from './mongo.repository';
import { TRANSFER_MODEL, TransferSchema, type TransferDoc } from './schemas';

const ORG = 'org-1';
let mem: MongoMemoryServer;
let trModel: Model<TransferDoc>;
let counterModel: Model<CounterDoc>;
let repo: MongoTransferRepository;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

function tr(over: Partial<TransferEntity> = {}): TransferEntity {
  const at = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: oid(),
    organizationId: ORG,
    transferNumber: 'TR-0001',
    sourceLocationId: oid(),
    sourceLocationName: 'Dock A',
    destinationLocationId: oid(),
    destinationLocationName: 'Shelf B',
    status: 'draft',
    note: null,
    lines: [
      { id: oid(), variantId: oid(), skuSnapshot: 'W-1', nameSnapshot: 'Widget', quantity: 5, dispatchedQty: 0, receivedQty: 0, unitCostMinor: null, currency: null },
    ],
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
  trModel = mongoose.model<TransferDoc>(TRANSFER_MODEL, TransferSchema);
  counterModel = mongoose.model<CounterDoc>(COUNTER_MODEL, CounterSchema);
  repo = new MongoTransferRepository(trModel, new MongoCounters(counterModel));
}, 60_000);

afterEach(async () => {
  await trModel.deleteMany({});
  await counterModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoTransferRepository', () => {
  it('roundtrips a transfer (nullable line cost intact) and mints TR sequences', async () => {
    const transfer = tr();
    await repo.insert(transfer);
    expect(await repo.findById(ORG, transfer.id)).toEqual(transfer);
    expect(await repo.nextNumber(ORG)).toBe('TR-0001');
    expect(await repo.nextNumber(ORG)).toBe('TR-0002');
  });

  it('updates, filters/sorts, and tallies by status', async () => {
    await repo.insert(tr({ transferNumber: 'TR-0001', status: 'draft', createdAt: new Date('2026-01-01T00:00:00.000Z') }));
    await repo.insert(tr({ transferNumber: 'TR-0002', status: 'in_transit', createdAt: new Date('2026-01-02T00:00:00.000Z') }));

    const recent = await repo.list(ORG, { page: 1, limit: 10, sort: '-createdAt' });
    expect(recent.items.map((t) => t.transferNumber)).toEqual(['TR-0002', 'TR-0001']);
    expect((await repo.list(ORG, { page: 1, limit: 10, sort: 'transferNumber', status: 'in_transit' })).items.map((t) => t.transferNumber)).toEqual(['TR-0002']);
    expect(await repo.countByStatus(ORG)).toEqual({ draft: 1, in_transit: 1 });
  });
});
