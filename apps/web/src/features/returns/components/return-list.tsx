'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Badge,
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
import { RETURN_STATUS, type ReturnListQuery, type ReturnStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useReturns } from '../queries';

const ALL = 'all';
const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function ReturnList() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ReturnStatus | undefined>(undefined);

  const query: ReturnListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useReturns(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Returns</h1>
          <p className="text-sm text-muted-foreground">Customer returns add stock; supplier returns remove it.</p>
        </div>
        <Button asChild>
          <Link href="/returns/new">
            <AddIcon className="size-4" aria-hidden="true" />
            New return
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
            placeholder="Search by return number…"
            aria-label="Search returns"
          />
        </div>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? undefined : (value as ReturnStatus));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="sm:w-52" placeholder="Status" />
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {RETURN_STATUS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState
          title="Couldn’t load returns"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }, (_, row) => (
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
                      No returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">
                        <Link href={`/returns/${ret.id}`} className="text-primary hover:underline">
                          {ret.returnNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge tone={ret.kind === 'customer' ? 'info' : 'neutral'}>
                          {ret.kind === 'customer' ? 'Customer' : 'Supplier'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ret.partyName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={ret.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{ret.lineCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(ret.updatedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'return' : 'returns'}
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
