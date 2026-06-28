import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, SortOrder } from 'mongoose';
import type { StockLevelListQuery, StockMovementListQuery, StockMovementType } from '@stockflow/types';
import type { StockLevelEntity, StockMovementEntity } from '../../domain/entities';
import type { StockLevelRepository, StockMovementRepository } from '../../application/ports';
import {
  LEVEL_MODEL,
  MOVEMENT_MODEL,
  levelKey,
  type StockLevelDoc,
  type StockMovementDoc,
} from './schemas';

function toMovementEntity(doc: StockMovementDoc): StockMovementEntity {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function toMovementDoc(entity: StockMovementEntity): StockMovementDoc {
  const { id, ...rest } = entity;
  return { _id: id, ...rest };
}

function toLevelEntity(doc: StockLevelDoc): StockLevelEntity {
  const { _id: _ignore, ...rest } = doc;
  return rest;
}

interface MovementFilter {
  organizationId: string;
  variantId?: string;
  locationId?: string;
  type?: StockMovementType;
}

interface LevelFilter {
  organizationId: string;
  variantId?: string;
  locationId?: string;
}

/**
 * Mongoose adapter for the append-only ledger (reads + the standalone insert used by the in-memory writer).
 * The transactional ledger append lives in `MongoLedgerWriter`; this adapter never mutates stock on its own
 * hot path.
 */
@Injectable()
export class MongoStockMovementRepository implements StockMovementRepository {
  constructor(@InjectModel(MOVEMENT_MODEL) private readonly model: Model<StockMovementDoc>) {}

  async insert(movement: StockMovementEntity): Promise<StockMovementEntity> {
    await this.model.create(toMovementDoc(movement));
    return { ...movement };
  }

  async findByOpKey(organizationId: string, opKey: string): Promise<StockMovementEntity | null> {
    const doc = await this.model.findOne({ organizationId, opKey }).lean<StockMovementDoc>().exec();
    return doc ? toMovementEntity(doc) : null;
  }

  async list(
    organizationId: string,
    query: StockMovementListQuery,
  ): Promise<{ items: StockMovementEntity[]; total: number }> {
    const filter: MovementFilter = { organizationId };
    if (query.variantId) filter.variantId = query.variantId;
    if (query.locationId) filter.locationId = query.locationId;
    if (query.type) filter.type = query.type;

    const descending = query.sort.startsWith('-');
    const dir: SortOrder = descending ? -1 : 1;
    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort({ createdAt: dir, _id: dir })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<StockMovementDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toMovementEntity), total };
  }

  async listByVariantLocation(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockMovementEntity[]> {
    const docs = await this.model
      .find({ organizationId, variantId, locationId })
      .sort({ createdAt: 1, _id: 1 })
      .lean<StockMovementDoc[]>()
      .exec();
    return docs.map(toMovementEntity);
  }
}

/**
 * Mongoose adapter for the on-hand projection (reads + the standalone upsert used by the in-memory writer).
 * The transactional upsert lives in `MongoLedgerWriter`. Cells are keyed by the composite `_id`.
 */
@Injectable()
export class MongoStockLevelRepository implements StockLevelRepository {
  constructor(@InjectModel(LEVEL_MODEL) private readonly model: Model<StockLevelDoc>) {}

  async findByCell(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<StockLevelEntity | null> {
    const doc = await this.model
      .findById(levelKey(organizationId, variantId, locationId))
      .lean<StockLevelDoc>()
      .exec();
    return doc ? toLevelEntity(doc) : null;
  }

  async upsert(level: StockLevelEntity): Promise<StockLevelEntity> {
    await this.model
      .updateOne(
        { _id: levelKey(level.organizationId, level.variantId, level.locationId) },
        { $set: { ...level } },
        { upsert: true },
      )
      .exec();
    return { ...level };
  }

  async list(
    organizationId: string,
    query: StockLevelListQuery,
  ): Promise<{ items: StockLevelEntity[]; total: number }> {
    const filter: LevelFilter = { organizationId };
    if (query.variantId) filter.variantId = query.variantId;
    if (query.locationId) filter.locationId = query.locationId;

    const descending = query.sort.startsWith('-');
    const field = descending ? query.sort.slice(1) : query.sort;
    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model
        .find(filter)
        .sort({ [field]: descending ? -1 : 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean<StockLevelDoc[]>()
        .exec(),
    ]);
    return { items: docs.map(toLevelEntity), total };
  }

  async listByVariant(organizationId: string, variantId: string): Promise<StockLevelEntity[]> {
    const docs = await this.model.find({ organizationId, variantId }).lean<StockLevelDoc[]>().exec();
    return docs.map(toLevelEntity);
  }

  async listAll(organizationId: string): Promise<StockLevelEntity[]> {
    const docs = await this.model.find({ organizationId }).lean<StockLevelDoc[]>().exec();
    return docs.map(toLevelEntity);
  }
}
