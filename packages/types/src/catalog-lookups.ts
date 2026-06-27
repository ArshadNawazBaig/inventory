import { z } from 'zod';
import { PageMetaSchema } from './catalog';

/**
 * Catalog lookup contracts (Categories · Brands · Units) — the single source of truth for validation
 * AND types, shared by API + worker + web. See docs/modules/catalog-lookups.md. These are the sibling
 * reference entities the Product module points at by id.
 */

// ─── Enums & permissions ─────────────────────────────────────────────────────
export const LOOKUP_STATUS = ['active', 'archived'] as const;
export type LookupStatus = (typeof LOOKUP_STATUS)[number];

export const CATEGORY_PERMISSIONS = { view: 'category.view', manage: 'category.manage' } as const;
export const BRAND_PERMISSIONS = { view: 'brand.view', manage: 'brand.manage' } as const;
export const UNIT_PERMISSIONS = { view: 'unit.view', manage: 'unit.manage' } as const;
export type LookupPermission =
  | (typeof CATEGORY_PERMISSIONS)[keyof typeof CATEGORY_PERMISSIONS]
  | (typeof BRAND_PERMISSIONS)[keyof typeof BRAND_PERMISSIONS]
  | (typeof UNIT_PERMISSIONS)[keyof typeof UNIT_PERMISSIONS];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const nameField = z.string().trim().min(1, 'Name is required').max(120);
const descriptionField = z.string().trim().max(2000);
const websiteField = z.string().trim().url('Must be a valid URL').max(2000);
const codeField = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(16)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 .\-/]*$/, 'Letters, numbers, space, dot, hyphen and slash only');

// ─── Shared list query ───────────────────────────────────────────────────────
export const LookupListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(['name', '-name', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt'])
      .default('name'),
    status: z.enum(LOOKUP_STATUS).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type LookupListQuery = z.infer<typeof LookupListQuerySchema>;

// Shared response envelope fields.
const lookupResponseBase = {
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(LOOKUP_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
};

// ─── Category ────────────────────────────────────────────────────────────────
export const CreateCategoryRequestSchema = z
  .object({ name: nameField, description: descriptionField.optional(), parentId: objectId.optional() })
  .strict();
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema = z
  .object({ name: nameField, description: descriptionField.nullable(), parentId: objectId.nullable() })
  .partial()
  .strict();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

export const CategoryResponseSchema = z.object({
  ...lookupResponseBase,
  parentId: z.string().nullable(),
});
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export const CategoryListResponseSchema = z.object({
  data: z.array(CategoryResponseSchema),
  meta: PageMetaSchema,
});
export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

// ─── Brand ───────────────────────────────────────────────────────────────────
export const CreateBrandRequestSchema = z
  .object({ name: nameField, description: descriptionField.optional(), website: websiteField.optional() })
  .strict();
export type CreateBrandRequest = z.infer<typeof CreateBrandRequestSchema>;

export const UpdateBrandRequestSchema = z
  .object({ name: nameField, description: descriptionField.nullable(), website: websiteField.nullable() })
  .partial()
  .strict();
export type UpdateBrandRequest = z.infer<typeof UpdateBrandRequestSchema>;

export const BrandResponseSchema = z.object({
  ...lookupResponseBase,
  website: z.string().nullable(),
});
export type BrandResponse = z.infer<typeof BrandResponseSchema>;

export const BrandListResponseSchema = z.object({
  data: z.array(BrandResponseSchema),
  meta: PageMetaSchema,
});
export type BrandListResponse = z.infer<typeof BrandListResponseSchema>;

// ─── Unit ────────────────────────────────────────────────────────────────────
export const CreateUnitRequestSchema = z
  .object({ name: nameField, code: codeField, description: descriptionField.optional() })
  .strict();
export type CreateUnitRequest = z.infer<typeof CreateUnitRequestSchema>;

export const UpdateUnitRequestSchema = z
  .object({ name: nameField, code: codeField, description: descriptionField.nullable() })
  .partial()
  .strict();
export type UpdateUnitRequest = z.infer<typeof UpdateUnitRequestSchema>;

export const UnitResponseSchema = z.object({
  ...lookupResponseBase,
  code: z.string(),
});
export type UnitResponse = z.infer<typeof UnitResponseSchema>;

export const UnitListResponseSchema = z.object({
  data: z.array(UnitResponseSchema),
  meta: PageMetaSchema,
});
export type UnitListResponse = z.infer<typeof UnitListResponseSchema>;
