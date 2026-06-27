import type { ReturnListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { ReturnEntity } from '../domain/entities';

/** Persistence port for returns. Tenant-scoped; `nextNumber` mints the per-tenant `RET-0001` sequence. */
export interface ReturnRepository {
  insert(ret: ReturnEntity): Promise<ReturnEntity>;
  findById(organizationId: string, id: string): Promise<ReturnEntity | null>;
  update(organizationId: string, id: string, patch: Partial<ReturnEntity>): Promise<ReturnEntity | null>;
  list(organizationId: string, query: ReturnListQuery): Promise<{ items: ReturnEntity[]; total: number }>;
  nextNumber(organizationId: string): Promise<string>;
}

/** A point-in-time snapshot of a variant for a return line. */
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

/** Read window into Parties — validate either party type + snapshot its name (the `PartyQuery` surface). */
export interface PartyRef {
  supplierExists(organizationId: string, id: string): Promise<boolean>;
  customerExists(organizationId: string, id: string): Promise<boolean>;
  getSupplierName(organizationId: string, id: string): Promise<string | null>;
  getCustomerName(organizationId: string, id: string): Promise<string | null>;
}

/** Read window into Locations — validate the location the return moves stock at. */
export interface LocationRef {
  locationExists(organizationId: string, id: string): Promise<boolean>;
}

export interface ReturnStockCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  refId: string;
  lineId: string;
  opKey: string;
}

/**
 * Write window into Inventory — post a return movement. `returnInbound` (`return_in`) for customer returns;
 * `returnOutbound` (`return_out`, negative-guarded) for supplier returns. Inventory stays the single ledger
 * writer.
 */
export interface ReturnPoster {
  returnInbound(ctx: ActorContext, cmd: ReturnStockCommand): Promise<void>;
  returnOutbound(ctx: ActorContext, cmd: ReturnStockCommand): Promise<void>;
}

// ─── DI tokens (framework-agnostic symbols; wired in returns.module.ts) ───────────
export const RETURN_REPOSITORY = Symbol('ReturnRepository');
export const RETURNS_CATALOG = Symbol('ReturnsCatalogRef');
export const RETURNS_PARTY = Symbol('ReturnsPartyRef');
export const RETURNS_LOCATION = Symbol('ReturnsLocationRef');
export const RETURNS_POSTER = Symbol('ReturnsReturnPoster');
export const RETURNS_ID_GENERATOR = Symbol('ReturnsIdGenerator');
export const RETURNS_CLOCK = Symbol('ReturnsClock');
