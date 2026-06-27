'use client';

import { useState, type ReactNode } from 'react';
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
  toast,
} from '@stockflow/ui';
import { AddIcon, DeleteIcon, EditIcon } from '@stockflow/icons';
import type { LookupListQuery, LookupStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { errorMessage } from '@/lib/api';
import type { LookupDescriptor } from '../descriptors';
import type { LookupRecord } from '../types';
import { useLookupList } from '../queries';
import { useArchiveLookup, useDeleteLookup, useRestoreLookup } from '../mutations';
import { LookupStatusBadge } from './lookup-status-badge';

export interface LookupColumn<T> {
  header: string;
  align?: 'right';
  cell: (row: T) => ReactNode;
}

interface FormDialogProps<T> {
  open: boolean;
  editing: T | null;
  onOpenChange: (open: boolean) => void;
}

export interface LookupManagerProps<T extends LookupRecord> {
  descriptor: LookupDescriptor<T>;
  /** Extra columns shown between Name and Status. */
  columns: LookupColumn<T>[];
  /** The resource's concrete create/edit dialog. */
  renderFormDialog: (props: FormDialogProps<T>) => ReactNode;
}

const STATUS_LABEL: Record<LookupStatus, string> = { active: 'Active', archived: 'Archived' };
const ALL = 'all';
const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/**
 * The generic lookup admin — list, search + status filter, pagination, and lifecycle actions (edit,
 * archive/restore, delete) for any resource described by a {@link LookupDescriptor}. The resource only
 * supplies its extra columns and its concrete form dialog; everything else is shared.
 */
export function LookupManager<T extends LookupRecord>({
  descriptor,
  columns,
  renderFormDialog,
}: LookupManagerProps<T>) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<LookupStatus | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'archive' | 'restore' | 'delete'; row: T } | null>(
    null,
  );

  const query: LookupListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: 'name',
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useLookupList(descriptor, query);
  const archive = useArchiveLookup(descriptor);
  const restore = useRestoreLookup(descriptor);
  const remove = useDeleteLookup(descriptor);

  const rows = data?.data ?? [];
  const meta = data?.meta.page;
  const columnCount = 1 + columns.length + 3; // Name + extra + Status + Updated + Actions
  const confirmPending = archive.isPending || restore.isPending || remove.isPending;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(row: T) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, row } = confirm;
    try {
      if (kind === 'archive') {
        await archive.mutateAsync(row.id);
        toast.success(`${descriptor.singular} archived`);
      } else if (kind === 'restore') {
        await restore.mutateAsync(row.id);
        toast.success(`${descriptor.singular} restored`);
      } else {
        await remove.mutateAsync(row.id);
        toast.success(`${descriptor.singular} deleted`);
      }
      setConfirm(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{descriptor.plural}</h1>
          <p className="text-sm text-muted-foreground">
            Reference data used to classify and measure products.
          </p>
        </div>
        <Button leadingIcon={AddIcon} onClick={openCreate}>
          New {descriptor.singular.toLowerCase()}
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
            placeholder={`Search ${descriptor.plural.toLowerCase()}…`}
            aria-label={`Search ${descriptor.plural.toLowerCase()}`}
          />
        </div>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? undefined : (value as LookupStatus));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="sm:w-44" placeholder="Status" />
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">{STATUS_LABEL.active}</SelectItem>
            <SelectItem value="archived">{STATUS_LABEL.archived}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState
          title={`Couldn’t load ${descriptor.plural.toLowerCase()}`}
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column.header} className={column.align === 'right' ? 'text-right' : undefined}>
                      {column.header}
                    </TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }, (_, row) => (
                    <TableRow key={`skeleton-${row}`}>
                      {Array.from({ length: columnCount }, (_, cell) => (
                        <TableCell key={cell}>
                          <Skeleton variant="text" className="max-w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                      No {descriptor.plural.toLowerCase()} found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      {columns.map((column) => (
                        <TableCell
                          key={column.header}
                          className={column.align === 'right' ? 'text-right tabular-nums' : undefined}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <LookupStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            leadingIcon={EditIcon}
                            onClick={() => openEdit(row)}
                            aria-label={`Edit ${row.name}`}
                          >
                            Edit
                          </Button>
                          {row.status === 'archived' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirm({ kind: 'restore', row })}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirm({ kind: 'archive', row })}
                            >
                              Archive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            leadingIcon={DeleteIcon}
                            onClick={() => setConfirm({ kind: 'delete', row })}
                            aria-label={`Delete ${row.name}`}
                          >
                            Delete
                          </Button>
                        </div>
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
                {meta.total} {meta.total === 1 ? descriptor.singular.toLowerCase() : descriptor.plural.toLowerCase()}
              </p>
              {meta.totalPages > 1 ? (
                <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {renderFormDialog({ open: dialogOpen, editing, onOpenChange: setDialogOpen })}

      <ConfirmDialog
        open={confirm?.kind === 'archive'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Archive this ${descriptor.singular.toLowerCase()}?`}
        description="It will be hidden from pickers but kept for history. You can restore it later."
        confirmLabel="Archive"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'restore'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Restore this ${descriptor.singular.toLowerCase()}?`}
        description="It becomes selectable again."
        confirmLabel="Restore"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Delete this ${descriptor.singular.toLowerCase()}?`}
        description="Soft-deletes it and frees the name for reuse. Products keep their reference until edited."
        confirmLabel="Delete"
        variant="destructive"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}
