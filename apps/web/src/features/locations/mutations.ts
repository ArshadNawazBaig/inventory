'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LocationResponse } from '@stockflow/types';
import {
  archiveLocation,
  createLocation,
  deleteLocation,
  restoreLocation,
  updateLocation,
} from './api';
import { locationQueryKeys } from './query-keys';

/**
 * Location mutations — they own cache invalidation only (toasts/closing live in the components).
 * Invalidating `locationQueryKeys.all` refreshes every list AND the active picker set.
 */

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation<LocationResponse, Error, unknown>({
    mutationFn: (body) => createLocation(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: locationQueryKeys.all }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation<LocationResponse, Error, { id: string; body: unknown }>({
    mutationFn: ({ id, body }) => updateLocation(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: locationQueryKeys.all }),
  });
}

export function useArchiveLocation() {
  const qc = useQueryClient();
  return useMutation<LocationResponse, Error, string>({
    mutationFn: (id) => archiveLocation(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: locationQueryKeys.all }),
  });
}

export function useRestoreLocation() {
  const qc = useQueryClient();
  return useMutation<LocationResponse, Error, string>({
    mutationFn: (id) => restoreLocation(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: locationQueryKeys.all }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteLocation(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: locationQueryKeys.all }),
  });
}
