import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { COUNTER_MODEL, type CounterDoc } from './counter.schema';

/**
 * Atomic per-tenant sequence generator backed by the `counters` collection. Shared by every module that mints
 * document numbers (PO-/SO-/TR-/RET-). The single `$inc` upsert is race-free across API instances.
 */
@Injectable()
export class MongoCounters {
  constructor(@InjectModel(COUNTER_MODEL) private readonly model: Model<CounterDoc>) {}

  /** Atomically increment and return the next value for a sequence key (e.g. `org-1:PO`). */
  async next(key: string): Promise<number> {
    const doc = await this.model
      .findByIdAndUpdate(key, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
      .lean<CounterDoc>()
      .exec();
    return doc?.seq ?? 1;
  }

  /** Mint a padded document number, e.g. `formatNext('org-1:PO', 'PO')` → `PO-0001`. */
  async formatNext(key: string, prefix: string, pad = 4): Promise<string> {
    const seq = await this.next(key);
    return `${prefix}-${String(seq).padStart(pad, '0')}`;
  }
}
