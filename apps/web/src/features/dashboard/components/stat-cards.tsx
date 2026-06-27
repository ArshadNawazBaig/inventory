'use client';

import { Card, CardContent } from '@stockflow/ui';
import {
  type LucideIcon,
  PurchaseOrderIcon,
  ReportIcon,
  SalesOrderIcon,
  TransferIcon,
  WarningIcon,
} from '@stockflow/icons';
import type { DashboardSummaryResponse } from '@stockflow/types';
import { formatMinorToMajor } from '@/lib/money';

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Highlight the figure when it represents work needing attention. */
  alert?: boolean;
}

function StatCard({ label, value, icon: Icon, alert }: Stat) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span
          className={
            alert
              ? 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning'
              : 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'
          }
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** The KPI tile row — stock value plus the open-work counts the operator acts on first. */
export function StatCards({ data }: { data: DashboardSummaryResponse }) {
  const ccy = data.inventory.currency ?? '';
  const stats: Stat[] = [
    {
      label: 'Stock value',
      value: `${formatMinorToMajor(data.inventory.totalValueMinor)} ${ccy}`.trim(),
      icon: ReportIcon,
    },
    { label: 'Low stock', value: data.counts.lowStock.toLocaleString(), icon: WarningIcon, alert: data.counts.lowStock > 0 },
    { label: 'Open purchase orders', value: data.counts.openPurchaseOrders.toLocaleString(), icon: PurchaseOrderIcon },
    { label: 'Open sales orders', value: data.counts.openSalesOrders.toLocaleString(), icon: SalesOrderIcon },
    { label: 'In-transit transfers', value: data.counts.inTransitTransfers.toLocaleString(), icon: TransferIcon },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
