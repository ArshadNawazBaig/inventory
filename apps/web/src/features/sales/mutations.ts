'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateSalesOrderRequest,
  FulfillSalesOrderRequest,
  SalesOrderResponse,
} from '@stockflow/types';
import { cancelSalesOrder, confirmSalesOrder, createSalesOrder, fulfillSalesOrder } from './api';
import { salesOrderKeys } from './query-keys';

/** Sales mutations — they own cache invalidation only (toasts/navigation live in components). */
export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation<SalesOrderResponse, Error, CreateSalesOrderRequest>({
    mutationFn: (body) => createSalesOrder(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesOrderKeys.all }),
  });
}

function useLifecycleMutation(action: (id: string) => Promise<SalesOrderResponse>) {
  const qc = useQueryClient();
  return useMutation<SalesOrderResponse, Error, string>({
    mutationFn: (id) => action(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesOrderKeys.all }),
  });
}

export const useConfirmSalesOrder = () => useLifecycleMutation(confirmSalesOrder);
export const useCancelSalesOrder = () => useLifecycleMutation(cancelSalesOrder);

export function useFulfillSalesOrder() {
  const qc = useQueryClient();
  return useMutation<SalesOrderResponse, Error, { id: string; body: FulfillSalesOrderRequest }>({
    mutationFn: ({ id, body }) => fulfillSalesOrder(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesOrderKeys.all }),
  });
}
