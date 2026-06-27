import type { MovementReasonKind, StockMovementType } from '@stockflow/types';

/**
 * Inventory domain entities (DATABASE §6). The ledger is the source of truth; the level is a projection.
 * Framework-free.
 */

/** Source ref that links a movement back to the document that caused it. */
export interface MovementReason {
  kind: MovementReasonKind;
  refId: string | null;
  lineId: string | null;
}

/**
 * A single immutable ledger entry — **append-only; never updated, never deleted**. `delta` is the only
 * thing that moves on-hand. `opKey` is the per-tenant idempotency key.
 */
export interface StockMovementEntity {
  id: string;
  organizationId: string;
  variantId: string;
  locationId: string;
  delta: number;
  type: StockMovementType;
  reason: MovementReason;
  unitCostMinor: number | null;
  currency: string | null;
  note: string | null;
  opKey: string;
  createdAt: Date;
  createdBy: string | null;
}

/**
 * The on-hand projection for one (variant × location). Derived from the ledger (`onHand ≡ Σ delta`) and
 * recomputed in the same transaction as each ledger write; independently reconstructable for reconciliation.
 */
export interface StockLevelEntity {
  organizationId: string;
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number; // persisted = onHand − reserved (indexable low-stock queries)
  inTransit: number;
  avgCostMinor: number | null;
  currency: string | null;
  lastMovementAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregated stock for a variant across all its locations — the read-model other modules consume. */
export interface VariantStockSummary {
  onHand: number;
  reserved: number;
  inTransit: number;
  hasOpenOrders: boolean;
}

export type InventoryAction = 'movement.posted';

/** Domain event emitted after a successful ledger write (consumed by audit/reports/realtime later). */
export interface InventoryEvent {
  action: InventoryAction;
  organizationId: string;
  variantId: string;
  locationId: string;
  movementId: string;
  type: StockMovementType;
  delta: number;
}
