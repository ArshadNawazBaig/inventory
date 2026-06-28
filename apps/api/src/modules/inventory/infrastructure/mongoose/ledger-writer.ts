import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import type { StockLevelEntity, StockMovementEntity } from '../../domain/entities';
import type { LedgerWriter } from '../../application/ports';
import {
  LEVEL_MODEL,
  MOVEMENT_MODEL,
  levelKey,
  type StockLevelDoc,
  type StockMovementDoc,
} from './schemas';

/**
 * The transactional ledger writer (the golden rule made real): the immutable `stock_movements` append and the
 * `stock_levels` projection upsert commit together inside a single Mongo **session transaction** — if either
 * fails, neither lands. Requires a replica set (production Mongo / `MongoMemoryReplSet` in tests).
 */
@Injectable()
export class MongoLedgerWriter implements LedgerWriter {
  constructor(
    @InjectModel(MOVEMENT_MODEL) private readonly movements: Model<StockMovementDoc>,
    @InjectModel(LEVEL_MODEL) private readonly levels: Model<StockLevelDoc>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async append(
    movement: StockMovementEntity,
    level: StockLevelEntity,
  ): Promise<{ movement: StockMovementEntity; level: StockLevelEntity }> {
    const { id, ...movementRest } = movement;
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.movements.create([{ _id: id, ...movementRest }], { session });
        await this.levels.updateOne(
          { _id: levelKey(level.organizationId, level.variantId, level.locationId) },
          { $set: { ...level } },
          { upsert: true, session },
        );
      });
    } finally {
      await session.endSession();
    }
    return { movement, level };
  }
}
