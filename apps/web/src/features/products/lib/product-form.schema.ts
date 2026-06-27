import { z } from 'zod';
import type {
  CreateProductRequest,
  CreateVariantRequest,
  ProductResponse,
  UpdateProductRequest,
  UpdateVariantRequest,
  VariantResponse,
} from '@stockflow/types';
import { formatMinorToMajor, parseMajorToMinor } from '@/lib/money';

/**
 * Form-shaped schemas + request mappers for the Product module UI.
 *
 * Why a separate schema from `@stockflow/types`? The wire contract (`CreateProductRequestSchema`, etc.)
 * models the *request*: integer minor-unit money, transformed/uppercased SKUs, strict objects. A form
 * models *human input*: every field is a string (text inputs), prices are major-unit decimals, blanks
 * mean "unset". These schemas validate that input for instant UX feedback; the mappers below translate
 * to the wire shape; and the **API re-validates authoritatively** against the shared contract (the SKU
 * uppercase transform, partial unique index, reference checks all live server-side). One contract, two
 * representations — not a duplicated source of truth.
 */

// ─── Reusable field validators (string inputs) ───────────────────────────────
const requiredHexId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');

const optionalHexId = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[a-fA-F0-9]{24}$/.test(v), 'Must be a 24-character hex id');

const optionalCount = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+$/.test(v), 'Must be a whole number ≥ 0');

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount (e.g. 12.50)');

const optionalCurrency = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[A-Za-z]{3}$/.test(v), 'ISO-4217 code, e.g. USD');

// ─── Variant form ────────────────────────────────────────────────────────────
export const variantFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .max(64, 'SKU is too long')
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Letters, numbers, hyphen and underscore only'),
  barcode: z.string().trim().max(64, 'Barcode is too long'),
  price: optionalMoney,
  currency: optionalCurrency,
  reorderPoint: optionalCount,
  reorderQty: optionalCount,
  unitId: optionalHexId,
});
export type VariantFormValues = z.infer<typeof variantFormSchema>;

// ─── Product details (shared by create + edit) ───────────────────────────────
export const productDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().trim().max(5000, 'Description is too long'),
  baseUnitId: requiredHexId,
  categoryId: optionalHexId,
  brandId: optionalHexId,
});
export type ProductDetailsValues = z.infer<typeof productDetailsSchema>;

// ─── Create product (details + ≥1 variant) ───────────────────────────────────
export const createProductFormSchema = productDetailsSchema.extend({
  variants: z.array(variantFormSchema).min(1, 'Add at least one variant'),
});
export type CreateProductFormValues = z.infer<typeof createProductFormSchema>;

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const emptyVariantForm: VariantFormValues = {
  sku: '',
  barcode: '',
  price: '',
  currency: 'USD',
  reorderPoint: '',
  reorderQty: '',
  unitId: '',
};

export const emptyCreateProductForm: CreateProductFormValues = {
  name: '',
  description: '',
  baseUnitId: '',
  categoryId: '',
  brandId: '',
  variants: [emptyVariantForm],
};

// ─── Mappers: form values → API request ──────────────────────────────────────
function trimmed(value: string): string {
  return value.trim();
}

/** A new variant for create / add. Only sets fields the user filled (blank = unset). */
export function toCreateVariant(values: VariantFormValues): CreateVariantRequest {
  const request: CreateVariantRequest = { sku: trimmed(values.sku).toUpperCase() };

  if (trimmed(values.barcode)) request.barcode = trimmed(values.barcode);
  if (trimmed(values.unitId)) request.unitId = trimmed(values.unitId);

  const minor = trimmed(values.price) ? parseMajorToMinor(values.price) : null;
  if (minor !== null) {
    request.defaultPriceMinor = minor;
    if (trimmed(values.currency)) request.currency = trimmed(values.currency).toUpperCase();
  }
  if (trimmed(values.reorderPoint)) request.reorderPoint = Number(values.reorderPoint);
  if (trimmed(values.reorderQty)) request.reorderQty = Number(values.reorderQty);

  return request;
}

/** Create-product request (product + initial variants), built atomically by the API in one txn. */
export function toCreateProductRequest(values: CreateProductFormValues): CreateProductRequest {
  const request: CreateProductRequest = {
    name: trimmed(values.name),
    baseUnitId: trimmed(values.baseUnitId),
    variants: values.variants.map(toCreateVariant),
  };

  if (trimmed(values.description)) request.description = trimmed(values.description);
  if (trimmed(values.categoryId)) request.categoryId = trimmed(values.categoryId);
  if (trimmed(values.brandId)) request.brandId = trimmed(values.brandId);

  return request;
}

/** Update-product request — product fields only (variants + status have their own endpoints). Blank
 * optional fields are sent as `null` to clear them. */
export function toUpdateProductRequest(values: ProductDetailsValues): UpdateProductRequest {
  return {
    name: trimmed(values.name),
    baseUnitId: trimmed(values.baseUnitId),
    description: trimmed(values.description) ? trimmed(values.description) : null,
    categoryId: trimmed(values.categoryId) ? trimmed(values.categoryId) : null,
    brandId: trimmed(values.brandId) ? trimmed(values.brandId) : null,
  };
}

/** Update an existing variant — blank optional fields clear (null); counts are omitted when blank. */
export function toUpdateVariantRequest(values: VariantFormValues): UpdateVariantRequest {
  const request: UpdateVariantRequest = {
    sku: trimmed(values.sku).toUpperCase(),
    barcode: trimmed(values.barcode) ? trimmed(values.barcode) : null,
    unitId: trimmed(values.unitId) ? trimmed(values.unitId) : null,
  };

  const minor = trimmed(values.price) ? parseMajorToMinor(values.price) : null;
  request.defaultPriceMinor = minor;
  request.currency = minor !== null && trimmed(values.currency) ? trimmed(values.currency).toUpperCase() : null;

  if (trimmed(values.reorderPoint)) request.reorderPoint = Number(values.reorderPoint);
  if (trimmed(values.reorderQty)) request.reorderQty = Number(values.reorderQty);

  return request;
}

// ─── Mappers: API response → form values (prefill) ───────────────────────────
export function productToDetailsValues(product: ProductResponse): ProductDetailsValues {
  return {
    name: product.name,
    description: product.description ?? '',
    baseUnitId: product.baseUnitId,
    categoryId: product.categoryId ?? '',
    brandId: product.brandId ?? '',
  };
}

export function variantToFormValues(variant: VariantResponse): VariantFormValues {
  return {
    sku: variant.sku,
    barcode: variant.barcode ?? '',
    price: variant.defaultPriceMinor != null ? formatMinorToMajor(variant.defaultPriceMinor) : '',
    currency: variant.currency ?? 'USD',
    reorderPoint: String(variant.reorderPoint),
    reorderQty: String(variant.reorderQty),
    unitId: variant.unitId ?? '',
  };
}
