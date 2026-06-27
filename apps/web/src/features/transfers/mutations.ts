'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTransferRequest, ReceiveTransferRequest, TransferResponse } from '@stockflow/types';
import { cancelTransfer, createTransfer, dispatchTransfer, receiveTransfer } from './api';
import { transferKeys } from './query-keys';

/** Transfers mutations — they own cache invalidation only (toasts/navigation live in components). */
export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation<TransferResponse, Error, CreateTransferRequest>({
    mutationFn: (body) => createTransfer(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: transferKeys.all }),
  });
}

function useLifecycleMutation(action: (id: string) => Promise<TransferResponse>) {
  const qc = useQueryClient();
  return useMutation<TransferResponse, Error, string>({
    mutationFn: (id) => action(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: transferKeys.all }),
  });
}

export const useDispatchTransfer = () => useLifecycleMutation(dispatchTransfer);
export const useCancelTransfer = () => useLifecycleMutation(cancelTransfer);

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation<TransferResponse, Error, { id: string; body: ReceiveTransferRequest }>({
    mutationFn: ({ id, body }) => receiveTransfer(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: transferKeys.all }),
  });
}
