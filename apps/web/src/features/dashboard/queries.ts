'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from './api';
import { dashboardKeys } from './query-keys';

/** The dashboard overview summary (KPIs + valuation + low-stock + recent activity), in one round-trip. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: ({ signal }) => getDashboardSummary(signal),
  });
}
