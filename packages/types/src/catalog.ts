import { z } from 'zod';

/**
 * Catalog (Product module) contracts — the single source of truth for validation
 * AND types, shared by API + worker + web. See docs/modules/product.md.
 */

// ─── Enums & permissions ─────────────────────────────────────────────────────
export const PRODUCT_STATUS = ['draft', 'active', 'archived'] as const;
export const VARIANT_STATUS = ['active', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type VariantStatus = (typeof VARIANT_STATUS)[number];

/** Catalog permission keys (RBAC). Enforced server-side once the auth module lands. */
export const CATALOG_PERMISSIONS = {
  view: 'product.view',
  create: 'product.create',
  update: 'product.update',
  delete: 'product.delete',
  import: 'product.import',
} as const;
export type CatalogPermission = (typeof CATALOG_PERMISSIONS)[keyof typeof CATALOG_PERMISSIONS];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const skuField = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Only letters, numbers, hyphen and underscore')
  .transform((value) => value.toUpperCase());
const barcodeField = z.string().trim().min(1).max(64);
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');
const moneyMinor = z.number().int().min(0);
const quantity = z.number().int().min(0);
const attributes = z
  .record(z.string().min(1).max(64), z.string().max(512))
  .refine((value) => Object.keys(value).length <= 50, 'At most 50 attributes');

// ─── Requests ────────────────────────────────────────────────────────────────
export const CreateVariantInputSchema = z
  .object({
    sku: skuField,
    barcode: barcodeField.optional(),
    attributes: attributes.optional(),
    unitId: objectId.optional(),
    reorderPoint: quantity.optional(),
    reorderQty: quantity.optional(),
    defaultPriceMinor: moneyMinor.optional(),
    currency: currencyField.optional(),
  })
  .strict();
export type CreateVariantInput = z.infer<typeof CreateVariantInputSchema>;

export const CreateProductRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(5000).optional(),
    categoryId: objectId.optional(),
    brandId: objectId.optional(),
    baseUnitId: objectId,
    attributes: attributes.optional(),
    imageFileIds: z.array(objectId).max(12).optional(),
    variants: z.array(CreateVariantInputSchema).min(1).max(100),
  })
  .strict();
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(5000).nullable(),
    categoryId: objectId.nullable(),
    brandId: objectId.nullable(),
    baseUnitId: objectId,
    attributes,
    imageFileIds: z.array(objectId).max(12),
  })
  .partial()
  .strict();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const CreateVariantRequestSchema = CreateVariantInputSchema;
export type CreateVariantRequest = z.infer<typeof CreateVariantRequestSchema>;

export const UpdateVariantRequestSchema = z
  .object({
    sku: skuField,
    barcode: barcodeField.nullable(),
    attributes,
    unitId: objectId.nullable(),
    reorderPoint: quantity,
    reorderQty: quantity,
    defaultPriceMinor: moneyMinor.nullable(),
    currency: currencyField.nullable(),
  })
  .partial()
  .strict();
export type UpdateVariantRequest = z.infer<typeof UpdateVariantRequestSchema>;

export const ListProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(['name', '-name', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt'])
      .default('-createdAt'),
    status: z.enum(PRODUCT_STATUS).optional(),
    categoryId: objectId.optional(),
    brandId: objectId.optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type ListProductsQuery = z.infer<typeof ListProductsQuerySchema>;

// ─── Responses ───────────────────────────────────────────────────────────────
export const VariantResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  barcode: z.string().nullable(),
  attributes: z.record(z.string(), z.string()),
  unitId: z.string().nullable(),
  reorderPoint: z.number().int(),
  reorderQty: z.number().int(),
  defaultPriceMinor: z.number().int().nullable(),
  currency: z.string().nullable(),
  status: z.enum(VARIANT_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type VariantResponse = z.infer<typeof VariantResponseSchema>;

export const ProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().nullable(),
  brandId: z.string().nullable(),
  baseUnitId: z.string(),
  attributes: z.record(z.string(), z.string()),
  imageFileIds: z.array(z.string()),
  status: z.enum(PRODUCT_STATUS),
  hasVariants: z.boolean(),
  variantCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  variants: z.array(VariantResponseSchema).optional(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;

export const PageMetaSchema = z.object({
  page: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;

export const ProductListResponseSchema = z.object({
  data: z.array(ProductResponseSchema),
  meta: PageMetaSchema,
});
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
