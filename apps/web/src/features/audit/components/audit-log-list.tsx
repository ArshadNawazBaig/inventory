'use client';

import { useState } from 'react';
import {
  Badge,
  Input,
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
import type { AuditLogListQuery, AuditLogResponse } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useAuditLogs } from '../queries';
import { formatActorType, humanizeAction, humanizeEntityType } from '../lib/audit-format';
import { AuditLogDetailDialog } from './audit-log-detail-dialog';

const ALL = 'all';
const PAGE_SIZE = 20;

/** Entity types that can be audited — mirrors the API's route→entity map (kept as a stable filter list). */
const ENTITY_TYPES = [
  'product',
  'category',
  'brand',
  'unit',
  'supplier',
  'customer',
  'warehouse',
  'location',
  'inventory',
  'purchase_order',
  'sales_order',
  'transfer',
  'return',
];

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function AuditLogList() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<AuditLogResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const query: AuditLogListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: '-createdAt',
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useAuditLogs(query);
  const rows = data?.data ?? [];
  const meta = data?.meta.page;

  function openDetail(entry: AuditLogResponse) {
    setSelected(entry);
    setDetailOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit log</h1>
        <p className="text-sm text-muted-foreground">An immutable record of who did what, when.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Search
          defaultValue={action}
          onSearch={(value) => {
            setAction(value);
            setPage(1);
          }}
          placeholder="Filter by action…"
          aria-label="Filter by action"
        />
        <Select
          value={entityType ?? ALL}
          onValueChange={(value) => {
            setEntityType(value === ALL ? undefined : value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by entity type" placeholder="Entity type" />
          <SelectContent>
            <SelectItem value={ALL}>All entity types</SelectItem>
            {ENTITY_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {humanizeEntityType(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
            setPage(1);
          }}
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
            setPage(1);
          }}
          aria-label="To date"
        />
      </div>

      {isError ? (
        <ErrorState
          title="Couldn’t load the audit log"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }, (_, row) => (
                    <TableRow key={`skeleton-${row}`}>
                      {Array.from({ length: 4 }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton variant="text" className="max-w-[160px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No audit entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(entry)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDetail(entry);
                        }
                      }}
                      aria-label={`View ${humanizeAction(entry.action)}`}
                    >
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{humanizeAction(entry.action)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {humanizeEntityType(entry.entityType)}
                        {entry.entityId ? <span className="font-mono text-xs"> · {entry.entityId}</span> : null}
                      </TableCell>
                      <TableCell>
                        {entry.actorId ?? <span className="text-muted-foreground">—</span>}{' '}
                        <Badge tone="neutral">{formatActorType(entry.actorType)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'entry' : 'entries'}
              </p>
              {meta.totalPages > 1 ? (
                <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <AuditLogDetailDialog entry={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
