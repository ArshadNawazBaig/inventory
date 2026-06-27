'use client';

import { useQuery } from '@tanstack/react-query';
import { getSettings } from './api';
import { settingsKeys } from './query-keys';

/** The organization settings singleton. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: ({ signal }) => getSettings(signal),
  });
}
