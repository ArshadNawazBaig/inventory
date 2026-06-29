import type { SaleListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth';
import type { PosSaleEntity } from '../domain/entities';

/** Persistence port for POS sales. `nextNumber` mints a per-tenant `RC-0001` receipt sequence. */
export interface PosSaleRepository {
  insert(sale: PosSaleEntity): Promise<PosSaleEntity>;
  findById(organizationId: string, id: string): Promise<PosSaleEntity | null>;
  list(organizationId: string, query: SaleListQuery): Promise<{ items: PosSaleEntity[]; total: number }>;
  nextNumber(organizationId: string): Promise<string>;
}

/** Read window into Inventory — available units at a (variant × location) cell, for pre-sale validation. */
export interface PosInventoryRef {
  availableAt(organizationId: string, variantId: string, locationId: string): Promise<number>;
}

export interface SellLineCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  refId: string;
  lineId: string;
  opKey: string;
}

/** Write window into Inventory — post a negative-guarded `shipment` movement (reason `pos_sale`). */
export interface PosStockPoster {
  sell(ctx: ActorContext, cmd: SellLineCommand): Promise<void>;
}

// ─── DI tokens (framework-agnostic symbols; wired in pos.module.ts) ───────────────
export const POS_SALE_REPOSITORY = Symbol('PosSaleRepository');
export const POS_INVENTORY = Symbol('PosInventoryRef');
export const POS_STOCK_POSTER = Symbol('PosStockPoster');
export const POS_ID_GENERATOR = Symbol('PosIdGenerator');
export const POS_CLOCK = Symbol('PosClock');
