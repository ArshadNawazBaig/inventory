import type { PurchaseOrderListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { PurchaseOrderEntity } from '../domain/entities';

/** Persistence port for purchase orders. Tenant-scoped; `nextNumber` mints the per-tenant PO sequence. */
export interface PurchaseOrderRepository {
  insert(order: PurchaseOrderEntity): Promise<PurchaseOrderEntity>;
  findById(organizationId: string, id: string): Promise<PurchaseOrderEntity | null>;
  update(organizationId: string, id: string, patch: Partial<PurchaseOrderEntity>): Promise<PurchaseOrderEntity | null>;
  list(organizationId: string, query: PurchaseOrderListQuery): Promise<{ items: PurchaseOrderEntity[]; total: number }>;
  nextNumber(organizationId: string): Promise<string>;
}

/** A point-in-time snapshot of a variant for an order line. */
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

/** Read window into Parties — validate the supplier + snapshot its name. */
export interface SupplierRef {
  supplierExists(organizationId: string, id: string): Promise<boolean>;
  getSupplierName(organizationId: string, id: string): Promise<string | null>;
}

/** Read window into Locations — validate the receiving warehouse + location, and their relationship. */
export interface WarehouseLocationRef {
  warehouseExists(organizationId: string, id: string): Promise<boolean>;
  locationExists(organizationId: string, id: string): Promise<boolean>;
  findWarehouseId(organizationId: string, locationId: string): Promise<string | null>;
}

export interface ReceiveStockCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  unitCostMinor: number;
  currency: string;
  refId: string;
  lineId: string;
  opKey: string;
}

/** Write window into Inventory — post a `receipt` movement (the only way stock enters from a PO). */
export interface ReceiptPoster {
  receive(ctx: ActorContext, cmd: ReceiveStockCommand): Promise<void>;
}

// ─── DI tokens (framework-agnostic symbols; wired in purchasing.module.ts) ───────
export const PURCHASE_ORDER_REPOSITORY = Symbol('PurchaseOrderRepository');
export const PURCHASING_CATALOG = Symbol('PurchasingCatalogRef');
export const PURCHASING_SUPPLIER = Symbol('PurchasingSupplierRef');
export const PURCHASING_LOCATION = Symbol('PurchasingWarehouseLocationRef');
export const PURCHASING_RECEIPT = Symbol('PurchasingReceiptPoster');
export const PURCHASING_ID_GENERATOR = Symbol('PurchasingIdGenerator');
export const PURCHASING_CLOCK = Symbol('PurchasingClock');
