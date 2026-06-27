'use client';

import Link from 'next/link';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@stockflow/ui';
import type { LowStockRow } from '@stockflow/types';

/** The most urgent reorder rows; links through to the full low-stock report. */
export function LowStockCard({ rows }: { rows: LowStockRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Needs reordering</CardTitle>
        <Link href="/reports" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Everything is above its reorder point. 🎉
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((row) => (
              <li key={row.variantId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.productName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{row.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  {row.onHand <= 0 ? (
                    <Badge tone="danger" dot>
                      Out of stock
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      Low
                    </Badge>
                  )}
                  <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                    order {row.suggestedQty}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
