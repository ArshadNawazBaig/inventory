'use client';

import { Skeleton } from '@stockflow/ui';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useDashboardSummary } from '../queries';
import { StatCards } from './stat-cards';
import { ValuationChartCard } from './valuation-chart-card';
import { LowStockCard } from './low-stock-card';
import { RecentActivityCard } from './recent-activity-card';

/** Dashboard overview — KPI tiles, value-by-warehouse, what needs reordering, and recent activity. */
export function DashboardView() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your inventory at a glance.</p>
      </header>

      {isError || (!data && !isLoading) ? (
        <ErrorState
          title="Couldn’t load the dashboard"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} variant="rounded" className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton variant="rounded" className="h-80 w-full lg:col-span-2" />
            <Skeleton variant="rounded" className="h-80 w-full" />
          </div>
        </div>
      ) : (
        <>
          <StatCards data={data} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ValuationChartCard byWarehouse={data.valuationByWarehouse} />
            </div>
            <LowStockCard rows={data.topLowStock} />
          </div>
          <RecentActivityCard movements={data.recentMovements} />
        </>
      )}
    </div>
  );
}
