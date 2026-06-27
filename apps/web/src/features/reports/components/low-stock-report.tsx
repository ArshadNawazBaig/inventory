'use client';

import { useState } from 'react';
import {
  Badge,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stockflow/ui';
import type { LowStockListQuery } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useLowStock } from '../queries';

const PAGE_SIZE = 20;

export function LowStockReport() {
  const [page, setPage] = useState(1);
  const query: LowStockListQuery = { page, limit: PAGE_SIZE };
  const { data, isLoading, isError, error, refetch } = useLowStock(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  if (isError) {
    return (
      <ErrorState
        title="Couldn’t load the low-stock report"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Reorder at</TableHead>
              <TableHead className="text-right">Suggested order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, row) => (
                <TableRow key={`skeleton-${row}`}>
                  {Array.from({ length: 6 }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" className="max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Everything is above its reorder point. 🎉
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.variantId}>
                  <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>
                    {row.onHand <= 0 ? (
                      <Badge tone="danger" dot>
                        Out of stock
                      </Badge>
                    ) : (
                      <Badge tone="warning" dot>
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.onHand}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.reorderPoint}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{row.suggestedQty}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {meta.total} {meta.total === 1 ? 'item needs' : 'items need'} attention
          </p>
          {meta.totalPages > 1 ? (
            <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
