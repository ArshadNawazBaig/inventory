import { Schema } from 'mongoose';

/**
 * The per-tenant sequence collection (DATABASE §13.3). One document per sequence, keyed by
 * `"{organizationId}:{prefix}"` (e.g. `org-1:PO`), holding a monotonically increasing `seq`. A single
 * `$inc` upsert mints the next number atomically — no read-modify-write race across instances.
 */
export const COUNTER_MODEL = 'Counter';

export interface CounterDoc {
  _id: string;
  seq: number;
}

export const CounterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String },
    seq: { type: Number, required: true, default: 0 },
  },
  { collection: 'counters', versionKey: false },
);
