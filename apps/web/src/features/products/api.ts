import { z } from 'zod';
import {
  ProductListResponseSchema,
  ProductResponseSchema,
  VariantResponseSchema,
  type CreateProductRequest,
  type CreateVariantRequest,
  type ListProductsQuery,
  type ProductListResponse,
  type ProductResponse,
  type UpdateProductRequest,
  type UpdateVariantRequest,
  type VariantResponse,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

const BASE = '/v1/products';

const VariantListSchema = z.array(VariantResponseSchema);

/**
 * Catalog (Product) REST bindings — one function per endpoint in `docs/modules/product.md §5`. Each
 * delegates to the shared `apiRequest` seam and validates the response against the shared Zod contract
 * (output validation). These are transport only; caching/invalidation lives in the React Query hooks.
 */

export function listProducts(
  query: ListProductsQuery,
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  return apiRequest(BASE, {
    query: {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      status: query.status,
      categoryId: query.categoryId,
      brandId: query.brandId,
      q: query.q,
    },
    schema: ProductListResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function getProduct(productId: string, signal?: AbortSignal): Promise<ProductResponse> {
  return apiRequest(`${BASE}/${productId}`, {
    schema: ProductResponseSchema,
    ...(signal ? { signal } : {}),
  });
}

export function createProduct(input: CreateProductRequest): Promise<ProductResponse> {
  return apiRequest(BASE, { method: 'POST', body: input, schema: ProductResponseSchema });
}

export function updateProduct(
  productId: string,
  input: UpdateProductRequest,
): Promise<ProductResponse> {
  return apiRequest(`${BASE}/${productId}`, {
    method: 'PATCH',
    body: input,
    schema: ProductResponseSchema,
  });
}

export function archiveProduct(productId: string): Promise<ProductResponse> {
  return apiRequest(`${BASE}/${productId}/archive`, {
    method: 'POST',
    schema: ProductResponseSchema,
  });
}

export function restoreProduct(productId: string): Promise<ProductResponse> {
  return apiRequest(`${BASE}/${productId}/restore`, {
    method: 'POST',
    schema: ProductResponseSchema,
  });
}

export function deleteProduct(productId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${productId}`, { method: 'DELETE' });
}

export function listVariants(productId: string, signal?: AbortSignal): Promise<VariantResponse[]> {
  return apiRequest(`${BASE}/${productId}/variants`, {
    schema: VariantListSchema,
    ...(signal ? { signal } : {}),
  });
}

export function addVariant(
  productId: string,
  input: CreateVariantRequest,
): Promise<VariantResponse> {
  return apiRequest(`${BASE}/${productId}/variants`, {
    method: 'POST',
    body: input,
    schema: VariantResponseSchema,
  });
}

export function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantRequest,
): Promise<VariantResponse> {
  return apiRequest(`${BASE}/${productId}/variants/${variantId}`, {
    method: 'PATCH',
    body: input,
    schema: VariantResponseSchema,
  });
}

export function deleteVariant(productId: string, variantId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${productId}/variants/${variantId}`, { method: 'DELETE' });
}
