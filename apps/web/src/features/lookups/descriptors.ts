import type { ZodType } from 'zod';
import {
  BrandListResponseSchema,
  BrandResponseSchema,
  CategoryListResponseSchema,
  CategoryResponseSchema,
  UnitListResponseSchema,
  UnitResponseSchema,
  type BrandResponse,
  type CategoryResponse,
  type PageMeta,
  type UnitResponse,
} from '@stockflow/types';
import type { LookupRecord } from './types';

/**
 * Everything generic lookup code needs to talk to one resource: its path segment, display names, and the
 * shared Zod contracts for output validation. One descriptor per lookup; the generic api/query/manager
 * code is parameterised by it.
 */
export interface LookupDescriptor<T extends LookupRecord> {
  resource: string;
  singular: string;
  plural: string;
  responseSchema: ZodType<T>;
  listSchema: ZodType<{ data: T[]; meta: PageMeta }>;
}

export const CATEGORIES: LookupDescriptor<CategoryResponse> = {
  resource: 'categories',
  singular: 'Category',
  plural: 'Categories',
  responseSchema: CategoryResponseSchema,
  listSchema: CategoryListResponseSchema,
};

export const BRANDS: LookupDescriptor<BrandResponse> = {
  resource: 'brands',
  singular: 'Brand',
  plural: 'Brands',
  responseSchema: BrandResponseSchema,
  listSchema: BrandListResponseSchema,
};

export const UNITS: LookupDescriptor<UnitResponse> = {
  resource: 'units',
  singular: 'Unit',
  plural: 'Units',
  responseSchema: UnitResponseSchema,
  listSchema: UnitListResponseSchema,
};
