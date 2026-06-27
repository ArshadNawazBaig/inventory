'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Pagination,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';
import { TRANSFER_STATUS, type TransferListQuery, type TransferStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useTransfers } from '../queries';

const ALL = 'all';
const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function TransferList() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<TransferStatus | undefined>(undefined);

  const query: TransferListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useTransfers(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transfers</h1>
          <p className="text-sm text-muted-foreground">Move stock between locations; dispatch then receive.</p>
        </div>
        <Button asChild>
          <Link href="/transfers/new">
            <AddIcon className="size-4" aria-hidden="true" />
            New transfer
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Search
            defaultValue={q}
            onSearch={(value) => {
              setQ(value);
              setPage(1);
            }}
            placeholder="Search by transfer number…"
            aria-label="Search transfers"
          />
        </div>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? undefined : (value as TransferStatus));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="sm:w-52" placeholder="Status" />
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {TRANSFER_STATUS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState
          title="Couldn’t load transfers"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }, (_, row) => (
                    <TableRow key={`skeleton-${row}`}>
                      {Array.from({ length: 5 }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton variant="text" className="max-w-[120px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No transfers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        <Link href={`/transfers/${transfer.id}`} className="text-primary hover:underline">
                          {transfer.transferNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transfer.sourceLocationName ?? '—'} → {transfer.destinationLocationName ?? '—'}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={transfer.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{transfer.lineCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(transfer.updatedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'transfer' : 'transfers'}
              </p>
              {meta.totalPages > 1 ? (
                <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
