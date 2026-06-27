'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListProductsQuery } from '@stockflow/types';
import { getProduct, listProducts, listVariants } from './api';
import { productKeys } from './query-keys';

/** Paginated/filtered product list. Keeps previous data during page/filter changes for a stable UI. */
export function useProducts(query: ListProductsQuery) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => listProducts(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single product with its variants. Disabled until an id is available. */
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(productId ?? ''),
    queryFn: ({ signal }) => getProduct(productId as string, signal),
    enabled: Boolean(productId),
  });
}

/** Variants for a product (the detail endpoint already embeds these; use when fetched standalone). */
export function useVariants(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.variants(productId ?? ''),
    queryFn: ({ signal }) => listVariants(productId as string, signal),
    enabled: Boolean(productId),
  });
}
