import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { StockLevelEntity, StockMovementEntity } from '../../domain/entities';
import { MongoStockLevelRepository, MongoStockMovementRepository } from './mongo.repositories';
import { MongoLedgerWriter } from './ledger-writer';
import {
  LEVEL_MODEL,
  MOVEMENT_MODEL,
  StockLevelSchema,
  StockMovementSchema,
  levelKey,
  type StockLevelDoc,
  type StockMovementDoc,
} from './schemas';

/**
 * Transactional ledger test against a real (ephemeral) **replica-set** MongoDB — proves the writer commits the
 * immutable movement + the projection together, the DB-level idempotency guard, and atomic rollback (a failed
 * projection write undoes the already-issued ledger append).
 */

const ORG = 'org-1';
const V = 'v'.repeat(24);
const L1 = '1'.repeat(24);
const L2 = '2'.repeat(24);

let mem: MongoMemoryReplSet;
let movementModel: Model<StockMovementDoc>;
let levelModel: Model<StockLevelDoc>;
let movements: MongoStockMovementRepository;
let levels: MongoStockLevelRepository;
let writer: MongoLedgerWriter;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');
const AT = new Date('2026-01-01T00:00:00.000Z');

function movement(over: Partial<StockMovementEntity> = {}): StockMovementEntity {
  return {
    id: oid(),
    organizationId: ORG,
    variantId: V,
    locationId: L1,
    delta: 5,
    type: 'adjustment',
    reason: { kind: 'manual', refId: null, lineId: null },
    unitCostMinor: null,
    currency: null,
    note: null,
    opKey: oid(),
    createdAt: AT,
    createdBy: 'user-1',
    ...over,
  };
}

function level(over: Partial<StockLevelEntity> = {}): StockLevelEntity {
  return {
    organizationId: ORG,
    variantId: V,
    locationId: L1,
    onHand: 5,
    reserved: 0,
    available: 5,
    inTransit: 0,
    avgCostMinor: null,
    currency: null,
    lastMovementAt: AT,
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}

beforeAll(async () => {
  mem = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mem.getUri());
  movementModel = mongoose.model<StockMovementDoc>(MOVEMENT_MODEL, StockMovementSchema);
  levelModel = mongoose.model<StockLevelDoc>(LEVEL_MODEL, StockLevelSchema);
  await Promise.all([movementModel.init(), levelModel.init()]); // build indexes (unique opKey guard)
  movements = new MongoStockMovementRepository(movementModel);
  levels = new MongoStockLevelRepository(levelModel);
  writer = new MongoLedgerWriter(movementModel, levelModel, mongoose.connection);
}, 120_000);

afterEach(async () => {
  await Promise.all([movementModel.deleteMany({}), levelModel.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('MongoLedgerWriter', () => {
  it('commits the movement and the projection together (atomic happy path)', async () => {
    const m = movement({ delta: 5 });
    const l = level({ onHand: 5, available: 5 });
    const result = await writer.append(m, l);
    expect(result.movement.id).toBe(m.id);

    expect(await movements.findByOpKey(ORG, m.opKey)).toEqual(m);
    expect(await levels.findByCell(ORG, V, L1)).toEqual(l);
    expect(await movements.listByVariantLocation(ORG, V, L1)).toHaveLength(1);
  });

  it('rejects a duplicate opKey (DB idempotency guard) without a partial write', async () => {
    const m1 = movement({ opKey: 'dup' });
    await writer.append(m1, level());
    const m2 = movement({ opKey: 'dup', delta: 7 }); // same opKey, different id
    await expect(writer.append(m2, level({ onHand: 12 }))).rejects.toThrow();
    expect(await movements.listByVariantLocation(ORG, V, L1)).toHaveLength(1); // m2 not added
  });

  it('rolls back the ledger append when the projection write fails (true transaction)', async () => {
    // Force the SECOND op (level upsert) to fail by adding a one-cell-per-variant unique index for this test.
    const idxName = await levelModel.collection.createIndex({ organizationId: 1, variantId: 1 }, { unique: true });
    try {
      await writer.append(movement({ locationId: L1 }), level({ locationId: L1 }));
      const doomed = movement({ locationId: L2 }); // new opKey, so the movement create itself succeeds…
      // …but its level upsert for (org,V,L2) violates the one-cell-per-variant index → the whole txn aborts.
      await expect(writer.append(doomed, level({ locationId: L2, onHand: 99 }))).rejects.toThrow();

      // The movement that DID succeed inside the aborted txn must be rolled back — not just the level.
      expect(await movements.findByOpKey(ORG, doomed.opKey)).toBeNull();
      expect(await movements.listByVariantLocation(ORG, V, L2)).toHaveLength(0);
      expect(await levels.findByCell(ORG, V, L2)).toBeNull();
      // The first cell is untouched.
      expect((await levels.findByCell(ORG, V, L1))?.onHand).toBe(5);
    } finally {
      await levelModel.collection.dropIndex(idxName);
    }
  });
});
