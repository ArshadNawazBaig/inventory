'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdjustmentResult, CreateAdjustmentRequest } from '@stockflow/types';
import { createAdjustment } from './api';
import { inventoryKeys } from './query-keys';

/**
 * Post a manual stock adjustment. Owns cache invalidation only (toast/close live in the dialog).
 * Invalidating `inventoryKeys.all` refreshes both the levels projection and the movements ledger.
 */
export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation<AdjustmentResult, Error, CreateAdjustmentRequest>({
    mutationFn: (body) => createAdjustment(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
}
