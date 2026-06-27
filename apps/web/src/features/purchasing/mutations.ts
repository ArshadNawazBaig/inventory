'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderResponse,
  ReceivePurchaseOrderRequest,
} from '@stockflow/types';
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  submitPurchaseOrder,
} from './api';
import { purchaseOrderKeys } from './query-keys';

/** Purchasing mutations — they own cache invalidation only (toasts/navigation live in components). */
export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation<PurchaseOrderResponse, Error, CreatePurchaseOrderRequest>({
    mutationFn: (body) => createPurchaseOrder(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}

function useLifecycleMutation(action: (id: string) => Promise<PurchaseOrderResponse>) {
  const qc = useQueryClient();
  return useMutation<PurchaseOrderResponse, Error, string>({
    mutationFn: (id) => action(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}

export const useSubmitPurchaseOrder = () => useLifecycleMutation(submitPurchaseOrder);
export const useCancelPurchaseOrder = () => useLifecycleMutation(cancelPurchaseOrder);

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation<PurchaseOrderResponse, Error, { id: string; body: ReceivePurchaseOrderRequest }>({
    mutationFn: ({ id, body }) => receivePurchaseOrder(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}
