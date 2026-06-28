import { Schema } from 'mongoose';
import type { TransferStatus } from '@stockflow/types';
import type { TransferLine } from '../../domain/entities';

/** Mongoose schema for transfers. `_id` = service-generated id; embedded `lines` are Mixed (no totals). */
export const TRANSFER_MODEL = 'Transfer';

export interface TransferDoc {
  _id: string;
  organizationId: string;
  transferNumber: string;
  sourceLocationId: string;
  sourceLocationName: string | null;
  destinationLocationId: string;
  destinationLocationName: string | null;
  status: TransferStatus;
  note: string | null;
  lines: TransferLine[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Untyped schema (embedded Mixed arrays); document typing is enforced at the model boundary.
export const TransferSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    transferNumber: { type: String, required: true },
    sourceLocationId: { type: String, required: true },
    sourceLocationName: { type: String, default: null },
    destinationLocationId: { type: String, required: true },
    destinationLocationName: { type: String, default: null },
    status: { type: String, required: true },
    note: { type: String, default: null },
    lines: { type: [Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'transfers', versionKey: false },
);
TransferSchema.index({ organizationId: 1, status: 1 });
TransferSchema.index({ organizationId: 1, transferNumber: 1 });
