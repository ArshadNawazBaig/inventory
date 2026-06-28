import { Schema } from 'mongoose';
import type { ProductStatus, VariantStatus } from '@stockflow/types';

/**
 * Mongoose schemas for the Catalog collections. Design choices kept consistent across the codebase:
 * - **`_id` is the service-generated 24-hex string** (from `ObjectIdGenerator`), not a native ObjectId — so
 *   the existing string ids + string cross-references map 1:1 with zero conversion.
 * - All id-like fields (organizationId, productId, categoryId…) are **strings** (tenant ids are arbitrary
 *   strings today; cross-collection refs are resolved via query services, never Mongoose `populate`).
 * - `versionKey` is off; soft-delete is a `deletedAt` timestamp (null = live).
 */

export const PRODUCT_MODEL = 'CatalogProduct';
export const VARIANT_MODEL = 'CatalogVariant';

/** The stored product document — the entity shape with `id` replaced by `_id`. */
export interface ProductDoc {
  _id: string;
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

export interface VariantDoc {
  _id: string;
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

export const ProductSchema = new Schema<ProductDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    categoryId: { type: String, default: null },
    brandId: { type: String, default: null },
    baseUnitId: { type: String, required: true },
    attributes: { type: Object, default: {} },
    imageFileIds: { type: [String], default: [] },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'products', versionKey: false },
);
ProductSchema.index({ organizationId: 1, deletedAt: 1 });

export const VariantSchema = new Schema<VariantDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    barcode: { type: String, default: null },
    attributes: { type: Object, default: {} },
    unitId: { type: String, default: null },
    reorderPoint: { type: Number, required: true },
    reorderQty: { type: Number, required: true },
    defaultPriceMinor: { type: Number, default: null },
    currency: { type: String, default: null },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { collection: 'variants', versionKey: false },
);
VariantSchema.index({ organizationId: 1, deletedAt: 1 });
VariantSchema.index({ organizationId: 1, productId: 1, deletedAt: 1 });
// Live-SKU lookups; uniqueness is enforced at the service layer (parity with the in-memory adapter). A
// partial unique index on { organizationId, sku } where deletedAt:null is a documented hardening follow-up.
VariantSchema.index({ organizationId: 1, sku: 1 });
