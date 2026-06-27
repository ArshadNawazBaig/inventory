import type { ProductStatus, VariantStatus } from '@stockflow/types';

/** Persisted product (catalog parent). Stock never lives here (Inventory owns it). */
export interface ProductEntity {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  baseUnitId: string;
  attributes: Record<string, string>;
  imageFileIds: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Persisted variant — the sellable/stockable unit; carries the SKU. */
export interface VariantEntity {
  id: string;
  organizationId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  attributes: Record<string, string>;
  unitId: string | null;
  reorderPoint: number;
  reorderQty: number;
  defaultPriceMinor: number | null;
  currency: string | null;
  status: VariantStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ProductWithVariants extends ProductEntity {
  variants: VariantEntity[];
}

export interface ProductListItem extends ProductEntity {
  variantCount: number;
}

/** Stock snapshot for a variant, read from the Inventory module (delete guards). */
export interface VariantStockSummary {
  onHand: number;
  reserved: number;
  inTransit: number;
  hasOpenOrders: boolean;
}

export type CatalogEventName =
  | 'ProductCreated'
  | 'ProductUpdated'
  | 'ProductArchived'
  | 'ProductRestored'
  | 'ProductDeleted'
  | 'VariantCreated'
  | 'VariantUpdated'
  | 'VariantDeleted';

export interface CatalogEvent {
  name: CatalogEventName;
  organizationId: string;
  payload: Record<string, unknown>;
}
