'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrganizationSettingsResponse, UpdateOrganizationSettingsRequest } from '@stockflow/types';
import { updateSettings } from './api';
import { settingsKeys } from './query-keys';

/**
 * Update the organization settings. Seeds the detail cache with the server's response and invalidates so any
 * other consumers refetch (e.g. the inventory policy now reflects the new `allowNegativeStock`).
 */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<OrganizationSettingsResponse, Error, UpdateOrganizationSettingsRequest>({
    mutationFn: (body) => updateSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
