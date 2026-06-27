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
import { SALES_ORDER_STATUS, type SalesOrderListQuery, type SalesOrderStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { formatMinorToMajor } from '@/lib/money';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { useSalesOrders } from '../queries';

const ALL = 'all';
const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function SalesOrderList() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<SalesOrderStatus | undefined>(undefined);

  const query: SalesOrderListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useSalesOrders(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sales orders</h1>
          <p className="text-sm text-muted-foreground">Outbound orders to customers; fulfilling ships stock.</p>
        </div>
        <Button asChild>
          <Link href="/sales/new">
            <AddIcon className="size-4" aria-hidden="true" />
            New sales order
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
            placeholder="Search by SO number…"
            aria-label="Search sales orders"
          />
        </div>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? undefined : (value as SalesOrderStatus));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="sm:w-52" placeholder="Status" />
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {SALES_ORDER_STATUS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState
          title="Couldn’t load sales orders"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                      No sales orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/sales/${order.id}`} className="text-primary hover:underline">
                          {order.soNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customerName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{order.lineCount}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinorToMajor(order.totals.totalMinor)} {order.currency}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.updatedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'sales order' : 'sales orders'}
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
