'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProductRequest,
  CreateVariantRequest,
  ProductResponse,
  UpdateProductRequest,
  UpdateVariantRequest,
  VariantResponse,
} from '@stockflow/types';
import {
  addVariant,
  archiveProduct,
  createProduct,
  deleteProduct,
  deleteVariant,
  restoreProduct,
  updateProduct,
  updateVariant,
} from './api';
import { productKeys } from './query-keys';

/**
 * Mutation hooks own **cache invalidation only** — the data-correctness concern. User feedback (toasts),
 * navigation, and mapping server validation errors back onto form fields stay in the components, where
 * the UX context lives. Every mutation invalidates the list (counts/derived fields change) plus the
 * affected detail.
 */

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<ProductResponse, Error, CreateProductRequest>({
    mutationFn: (input) => createProduct(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<ProductResponse, Error, { productId: string; input: UpdateProductRequest }>({
    mutationFn: ({ productId, input }) => updateProduct(productId, input),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation<ProductResponse, Error, string>({
    mutationFn: (productId) => archiveProduct(productId),
    onSuccess: (_data, productId) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation<ProductResponse, Error, string>({
    mutationFn: (productId) => restoreProduct(productId),
    onSuccess: (_data, productId) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: (_data, productId) => {
      qc.removeQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useAddVariant() {
  const qc = useQueryClient();
  return useMutation<VariantResponse, Error, { productId: string; input: CreateVariantRequest }>({
    mutationFn: ({ productId, input }) => addVariant(productId, input),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation<
    VariantResponse,
    Error,
    { productId: string; variantId: string; input: UpdateVariantRequest }
  >({
    mutationFn: ({ productId, variantId, input }) => updateVariant(productId, variantId, input),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation<void, Error, { productId: string; variantId: string }>({
    mutationFn: ({ productId, variantId }) => deleteVariant(productId, variantId),
    onSuccess: (_data, { productId }) => {
      void qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
