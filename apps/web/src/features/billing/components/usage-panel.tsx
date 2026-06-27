'use client';

import { Card, CardContent, CardHeader, CardTitle, cn } from '@stockflow/ui';
import type { BillingUsageResponse, UsageMetric } from '@stockflow/types';
import { formatLimit, isOverLimit, usagePercent } from '../lib/billing-format';

function UsageBar({ label, metric }: { label: string; metric: UsageMetric }) {
  const pct = usagePercent(metric);
  const over = isOverLimit(metric);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={cn('tabular-nums', over ? 'text-destructive' : 'text-muted-foreground')}>
          {metric.used.toLocaleString()} / {formatLimit(metric.limit)}
        </span>
      </div>
      {pct === null ? (
        <p className="text-xs text-muted-foreground">No limit on this plan.</p>
      ) : (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
          <div
            className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** Usage against the active plan's limits — variants and locations. */
export function UsagePanel({ usage }: { usage: BillingUsageResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <UsageBar label="Variants" metric={usage.usage.variants} />
        <UsageBar label="Locations" metric={usage.usage.locations} />
      </CardContent>
    </Card>
  );
}
