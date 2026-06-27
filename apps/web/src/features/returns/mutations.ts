'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateReturnRequest, ReturnResponse } from '@stockflow/types';
import { cancelReturn, completeReturn, createReturn } from './api';
import { returnKeys } from './query-keys';

/** Returns mutations — they own cache invalidation only (toasts/navigation live in components). */
export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation<ReturnResponse, Error, CreateReturnRequest>({
    mutationFn: (body) => createReturn(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: returnKeys.all }),
  });
}

function useLifecycleMutation(action: (id: string) => Promise<ReturnResponse>) {
  const qc = useQueryClient();
  return useMutation<ReturnResponse, Error, string>({
    mutationFn: (id) => action(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: returnKeys.all }),
  });
}

export const useCompleteReturn = () => useLifecycleMutation(completeReturn);
export const useCancelReturn = () => useLifecycleMutation(cancelReturn);
