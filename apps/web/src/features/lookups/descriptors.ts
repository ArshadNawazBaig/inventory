import {
  BrandListResponseSchema,
  BrandResponseSchema,
  CategoryListResponseSchema,
  CategoryResponseSchema,
  UnitListResponseSchema,
  UnitResponseSchema,
  type BrandResponse,
  type CategoryResponse,
  type UnitResponse,
} from '@stockflow/types';
import type { ResourceDescriptor } from '@/features/resources/descriptor';

/** Resource descriptors for the three catalog lookups — consumed by the generic resource toolkit. */
export const CATEGORIES: ResourceDescriptor<CategoryResponse> = {
  resource: 'categories',
  singular: 'Category',
  plural: 'Categories',
  responseSchema: CategoryResponseSchema,
  listSchema: CategoryListResponseSchema,
};

export const BRANDS: ResourceDescriptor<BrandResponse> = {
  resource: 'brands',
  singular: 'Brand',
  plural: 'Brands',
  responseSchema: BrandResponseSchema,
  listSchema: BrandListResponseSchema,
};

export const UNITS: ResourceDescriptor<UnitResponse> = {
  resource: 'units',
  singular: 'Unit',
  plural: 'Units',
  responseSchema: UnitResponseSchema,
  listSchema: UnitListResponseSchema,
};
