import type { TransferStatus } from '@stockflow/types';

/**
 * Transfer domain entities (DATABASE §9). A transfer moves stock between two locations in two legs. Lines are
 * embedded and carry **snapshots** of the variant's sku/name at order time (historical accuracy). `unitCostMinor`
 * is captured from the source's running average at **dispatch** so the inbound leg lands at the right valuation.
 * Framework-free.
 */
export interface TransferLine {
  id: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  quantity: number;
  dispatchedQty: number;
  receivedQty: number;
  unitCostMinor: number | null; // captured at dispatch (source average); null until dispatched
  currency: string | null; // captured at dispatch alongside the cost; null until dispatched
}

export interface TransferEntity {
  id: string;
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
