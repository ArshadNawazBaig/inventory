import type { ReturnKind, ReturnStatus } from '@stockflow/types';

/**
 * Return domain entities (DATABASE §10). A return is `kind`-discriminated: a **customer** return brings stock
 * back in; a **supplier** return sends stock back out. Lines are embedded and carry **snapshots** of the
 * variant's sku/name at creation (historical accuracy). Framework-free.
 */
export interface ReturnLine {
  id: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  quantity: number;
}

export interface ReturnEntity {
  id: string;
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
