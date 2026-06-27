import type { SalesOrderListQuery } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth/actor-context';
import type { SalesOrderEntity } from '../domain/entities';

/** Persistence port for sales orders. Tenant-scoped; `nextNumber` mints the per-tenant SO sequence. */
export interface SalesOrderRepository {
  insert(order: SalesOrderEntity): Promise<SalesOrderEntity>;
  findById(organizationId: string, id: string): Promise<SalesOrderEntity | null>;
  update(organizationId: string, id: string, patch: Partial<SalesOrderEntity>): Promise<SalesOrderEntity | null>;
  list(organizationId: string, query: SalesOrderListQuery): Promise<{ items: SalesOrderEntity[]; total: number }>;
  /** Tally of orders per status for the tenant — the basis for dashboard KPIs. */
  countByStatus(organizationId: string): Promise<Record<string, number>>;
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

/** Read window into Parties — validate the customer + snapshot its name. */
export interface CustomerRef {
  customerExists(organizationId: string, id: string): Promise<boolean>;
  getCustomerName(organizationId: string, id: string): Promise<string | null>;
}

/** Read window into Locations — validate the fulfilment warehouse + location, and their relationship. */
export interface WarehouseLocationRef {
  warehouseExists(organizationId: string, id: string): Promise<boolean>;
  locationExists(organizationId: string, id: string): Promise<boolean>;
  findWarehouseId(organizationId: string, locationId: string): Promise<string | null>;
}

export interface ShipStockCommand {
  variantId: string;
  locationId: string;
  quantity: number;
  refId: string;
  lineId: string;
  opKey: string;
}

/** Write window into Inventory — post a `shipment` movement (the only way stock leaves from an SO). */
export interface ShipmentPoster {
  ship(ctx: ActorContext, cmd: ShipStockCommand): Promise<void>;
}

// ─── DI tokens (framework-agnostic symbols; wired in sales.module.ts) ────────────
export const SALES_ORDER_REPOSITORY = Symbol('SalesOrderRepository');
export const SALES_CATALOG = Symbol('SalesCatalogRef');
export const SALES_CUSTOMER = Symbol('SalesCustomerRef');
export const SALES_LOCATION = Symbol('SalesWarehouseLocationRef');
export const SALES_SHIPMENT = Symbol('SalesShipmentPoster');
export const SALES_ID_GENERATOR = Symbol('SalesIdGenerator');
export const SALES_CLOCK = Symbol('SalesClock');
