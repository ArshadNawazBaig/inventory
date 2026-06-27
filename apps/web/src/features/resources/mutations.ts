'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  archiveResource,
  createResource,
  deleteResource,
  restoreResource,
  updateResource,
} from './api';
import type { ResourceDescriptor } from './descriptor';
import { resourceKeys } from './query-keys';
import type { ResourceRecord } from './types';

/**
 * Generic resource mutations — they own cache invalidation only (toasts/closing live in the dialogs).
 * Invalidating `resourceKeys(resource).all` refreshes every list AND the active picker set, so a new
 * row immediately appears in any dependent dropdown.
 */

export function useCreateResource<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, unknown>({
    mutationFn: (body) => createResource(descriptor, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: resourceKeys(descriptor.resource).all }),
  });
}

export function useUpdateResource<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, { id: string; body: unknown }>({
    mutationFn: ({ id, body }) => updateResource(descriptor, id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: resourceKeys(descriptor.resource).all }),
  });
}

export function useArchiveResource<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, string>({
    mutationFn: (id) => archiveResource(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: resourceKeys(descriptor.resource).all }),
  });
}

export function useRestoreResource<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<T, Error, string>({
    mutationFn: (id) => restoreResource(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: resourceKeys(descriptor.resource).all }),
  });
}

export function useDeleteResource<T extends ResourceRecord>(descriptor: ResourceDescriptor<T>) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteResource(descriptor, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: resourceKeys(descriptor.resource).all }),
  });
}
