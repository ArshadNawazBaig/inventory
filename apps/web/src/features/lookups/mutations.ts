'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  archiveLookup,
  createLookup,
  deleteLookup,
  restoreLookup,
  updateLookup,
} from './api';
import type { LookupDescriptor } from './descriptors';
import { lookupKeys } from './query-keys';
import type { LookupRecord } from './types';

/**
 * Generic lookup mutations — they own cache invalidation only (toasts/closing live in the dialogs).
 * Invalidating `lookupKeys(resource).all` refreshes every list AND the active picker set, so a new
 * category immediately appears in the Product form's category dropdown.
 */

export function useCreateLookup<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, unknown>({
    mutationFn: (body) => createLookup(descriptor, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: lookupKeys(descriptor.resource).all }),
  });
}

export function useUpdateLookup<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, { id: string; body: unknown }>({
    mutationFn: ({ id, body }) => updateLookup(descriptor, id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: lookupKeys(descriptor.resource).all }),
  });
}

export function useArchiveLookup<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, string>({
    mutationFn: (id) => archiveLookup(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: lookupKeys(descriptor.resource).all }),
  });
}

export function useRestoreLookup<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, string>({
    mutationFn: (id) => restoreLookup(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: lookupKeys(descriptor.resource).all }),
  });
}

export function useDeleteLookup<T extends LookupRecord>(descriptor: LookupDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteLookup(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: lookupKeys(descriptor.resource).all }),
  });
}
