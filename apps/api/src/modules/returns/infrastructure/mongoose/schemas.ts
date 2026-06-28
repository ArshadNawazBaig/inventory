import { Schema } from 'mongoose';
import type { ReturnKind, ReturnStatus } from '@stockflow/types';
import type { ReturnLine } from '../../domain/entities';

/** Mongoose schema for returns. `_id` = service-generated id; embedded `lines` are Mixed. */
export const RETURN_MODEL = 'Return';

export interface ReturnDoc {
  _id: string;
  organizationId: string;
  returnNumber: string;
  kind: ReturnKind;
  partyId: string;
  partyName: string | null;
  locationId: string;
  status: ReturnStatus;
  reason: string | null;
  note: string | null;
  lines: ReturnLine[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// Untyped schema (embedded Mixed arrays); document typing is enforced at the model boundary.
export const ReturnSchema = new Schema(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    returnNumber: { type: String, required: true },
    kind: { type: String, required: true },
    partyId: { type: String, required: true },
    partyName: { type: String, default: null },
    locationId: { type: String, required: true },
    status: { type: String, required: true },
    reason: { type: String, default: null },
    note: { type: String, default: null },
    lines: { type: [Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'returns', versionKey: false },
);
ReturnSchema.index({ organizationId: 1, status: 1 });
ReturnSchema.index({ organizationId: 1, returnNumber: 1 });
