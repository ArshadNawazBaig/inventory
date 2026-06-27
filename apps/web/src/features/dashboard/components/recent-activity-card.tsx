'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@stockflow/ui';
import type { RecentMovement } from '@stockflow/types';
import { formatRelativeTime } from '@/lib/time';
import { formatDelta, movementReasonIcon, movementTypeLabel } from '../lib/dashboard-format';

/** The newest ledger entries, enriched into a readable feed (icon · what · where · when). */
export function RecentActivityCard({ movements }: { movements: RecentMovement[] }) {
  const now = Date.now();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No stock movements yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {movements.map((m) => {
              const Icon = movementReasonIcon(m.reasonKind);
              const inbound = m.delta > 0;
              return (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      <span className="font-medium">{movementTypeLabel(m.type)}</span>
                      {m.productName ? ` · ${m.productName}` : ''}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.sku ? `${m.sku} · ` : ''}
                      {m.locationName ?? 'Unknown location'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={
                        inbound
                          ? 'text-sm font-semibold tabular-nums text-success'
                          : 'text-sm font-semibold tabular-nums text-foreground'
                      }
                    >
                      {formatDelta(m.delta)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(m.createdAt, now)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
