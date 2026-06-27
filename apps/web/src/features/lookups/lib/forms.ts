import { z } from 'zod';
import type {
  BrandResponse,
  CategoryResponse,
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateUnitRequest,
  UnitResponse,
  UpdateBrandRequest,
  UpdateCategoryRequest,
  UpdateUnitRequest,
} from '@stockflow/types';

/**
 * Form-shaped schemas + request mappers for the lookups. As with Product, the wire contract lives in
 * `@stockflow/types`; these model human input (all-string fields, blank = unset) and translate to the
 * request shape. The API re-validates authoritatively.
 */

const nameField = z.string().trim().min(1, 'Name is required').max(120, 'Name is too long');
const descriptionField = z.string().trim().max(2000, 'Description is too long');
const optionalHexId = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[a-fA-F0-9]{24}$/.test(v), 'Must be a 24-character id');

function trimmed(value: string): string {
  return value.trim();
}

// ─── Category ──────────────────────────────────────────────────────────────────
export const categoryFormSchema = z.object({
  name: nameField,
  description: descriptionField,
  parentId: optionalHexId,
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export const emptyCategoryForm: CategoryFormValues = { name: '', description: '', parentId: '' };

export function categoryToForm(category: CategoryResponse): CategoryFormValues {
  return { name: category.name, description: category.description ?? '', parentId: category.parentId ?? '' };
}
export function toCreateCategory(values: CategoryFormValues): CreateCategoryRequest {
  const request: CreateCategoryRequest = { name: trimmed(values.name) };
  if (trimmed(values.description)) request.description = trimmed(values.description);
  if (trimmed(values.parentId)) request.parentId = trimmed(values.parentId);
  return request;
}
export function toUpdateCategory(values: CategoryFormValues): UpdateCategoryRequest {
  return {
    name: trimmed(values.name),
    description: trimmed(values.description) ? trimmed(values.description) : null,
    parentId: trimmed(values.parentId) ? trimmed(values.parentId) : null,
  };
}

// ─── Brand ───────────────────────────────────────────────────────────────────
export const brandFormSchema = z.object({
  name: nameField,
  description: descriptionField,
  website: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\/.+/.test(v), 'Must be a valid URL (http/https)'),
});
export type BrandFormValues = z.infer<typeof brandFormSchema>;
export const emptyBrandForm: BrandFormValues = { name: '', description: '', website: '' };

export function brandToForm(brand: BrandResponse): BrandFormValues {
  return { name: brand.name, description: brand.description ?? '', website: brand.website ?? '' };
}
export function toCreateBrand(values: BrandFormValues): CreateBrandRequest {
  const request: CreateBrandRequest = { name: trimmed(values.name) };
  if (trimmed(values.description)) request.description = trimmed(values.description);
  if (trimmed(values.website)) request.website = trimmed(values.website);
  return request;
}
export function toUpdateBrand(values: BrandFormValues): UpdateBrandRequest {
  return {
    name: trimmed(values.name),
    description: trimmed(values.description) ? trimmed(values.description) : null,
    website: trimmed(values.website) ? trimmed(values.website) : null,
  };
}

// ─── Unit ─────────────────────────────────────────────────────────────────────
export const unitFormSchema = z.object({
  name: nameField,
  description: descriptionField,
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(16, 'Code is too long')
    .regex(/^[A-Za-z0-9][A-Za-z0-9 .\-/]*$/, 'Letters, numbers, space, dot, hyphen and slash only'),
});
export type UnitFormValues = z.infer<typeof unitFormSchema>;
export const emptyUnitForm: UnitFormValues = { name: '', description: '', code: '' };

export function unitToForm(unit: UnitResponse): UnitFormValues {
  return { name: unit.name, description: unit.description ?? '', code: unit.code };
}
export function toCreateUnit(values: UnitFormValues): CreateUnitRequest {
  const request: CreateUnitRequest = { name: trimmed(values.name), code: trimmed(values.code) };
  if (trimmed(values.description)) request.description = trimmed(values.description);
  return request;
}
export function toUpdateUnit(values: UnitFormValues): UpdateUnitRequest {
  return {
    name: trimmed(values.name),
    code: trimmed(values.code),
    description: trimmed(values.description) ? trimmed(values.description) : null,
  };
}
