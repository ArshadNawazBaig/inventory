import type { TransferListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { TransferEntity } from '../domain/entities';

/** Persistence port for transfers. Tenant-scoped; `nextNumber` mints the per-tenant `TR-0001` sequence. */
export interface TransferRepository {
  insert(transfer: TransferEntity): Promise<TransferEntity>;
  findById(organizationId: string, id: string): Promise<TransferEntity | null>;
  update(organizationId: string, id: string, patch: Partial<TransferEntity>): Promise<TransferEntity | null>;
  list(organizationId: string, query: TransferListQuery): Promise<{ items: TransferEntity[]; total: number }>;
  nextNumber(organizationId: string): Promise<string>;
}

/** A point-in-time snapshot of a variant for a transfer line. */
export interface VariantSnapshot {
  sku: string;
  productName: string;
  defaultPriceMinor: number | null;
  currency: string | null;
}

/** Read window into Catalog — snapshot a variant for a line (also validates existence: null = unknown). */
export interface CatalogRef {
  getVariantSnapshot(organizationId: string, variantId: string): Promise<VariantSnapshot | null>;
}

/** Read window into Locations — validate the source/destination locations + snapshot their labels. */
export interface LocationRef {
  locationExists(organizationId: string, id: string): Promise<boolean>;
  getLocationLabel(organizationId: string, id: string): Promise<string | null>;
}

/** The valuation captured from the source when the outbound leg posts (drives the inbound leg's cost). */
export interface MoveOutResult {
  unitCostMinor: number | null;
  currency: string | null;
}

export interface MoveOutCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  refId: string;
  lineId: string;
  opKey: string;
}

export interface MoveInCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  unitCostMinor: number | null;
  currency: string | null;
  refId: string;
  lineId: string;
  opKey: string;
}

/**
 * Write window into Inventory — post the two transfer legs. `transferOut` is negative-guarded and returns the
 * source's captured valuation; `transferIn` lands that valuation at the destination. Inventory stays the single
 * ledger writer.
 */
export interface StockMover {
  transferOut(ctx: ActorContext, cmd: MoveOutCommand): Promise<MoveOutResult>;
  transferIn(ctx: ActorContext, cmd: MoveInCommand): Promise<void>;
}

// ─── DI tokens (framework-agnostic symbols; wired in transfers.module.ts) ────────
export const TRANSFER_REPOSITORY = Symbol('TransferRepository');
export const TRANSFERS_CATALOG = Symbol('TransfersCatalogRef');
export const TRANSFERS_LOCATION = Symbol('TransfersLocationRef');
export const TRANSFERS_STOCK_MOVER = Symbol('TransfersStockMover');
export const TRANSFERS_ID_GENERATOR = Symbol('TransfersIdGenerator');
export const TRANSFERS_CLOCK = Symbol('TransfersClock');
