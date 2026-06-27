'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { LocationListQuery, LocationResponse, LookupStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { errorMessage } from '@/lib/api';
import { useActiveResources } from '@/features/resources/queries';
import { ResourceStatusBadge } from '@/features/resources/components/resource-status-badge';
import { WAREHOUSES } from '../descriptors';
import { useLocationList } from '../queries';
import { useArchiveLocation, useDeleteLocation, useRestoreLocation } from '../mutations';
import { LOCATION_TYPE_OPTIONS } from '../lib/forms';
import { LocationFormDialog } from './location-form-dialog';

const ALL = 'all';
const PAGE_SIZE = 20;
const STATUS_LABEL: Record<LookupStatus, string> = { active: 'Active', archived: 'Archived' };
const TYPE_LABEL = Object.fromEntries(LOCATION_TYPE_OPTIONS.map((option) => [option.value, option.label]));

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/**
 * Locations admin — pick a warehouse, then manage its Warehouse → Zone → … → Bin tree. Bespoke (locations
 * are warehouse-scoped, not a generic tenant-wide resource), but reuses the shared status badge, confirm
 * dialogs and table primitives.
 */
export function LocationAdmin() {
  const warehouses = useActiveResources(WAREHOUSES);
  const warehouseOptions = useMemo(() => warehouses.data?.data ?? [], [warehouses.data]);

  const [warehouseId, setWarehouseId] = useState('');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<LookupStatus | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocationResponse | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'archive' | 'restore' | 'delete'; row: LocationResponse } | null>(
    null,
  );

  // Default to the first warehouse once the list arrives.
  useEffect(() => {
    if (!warehouseId && warehouseOptions.length > 0) {
      setWarehouseId(warehouseOptions[0]!.id);
    }
  }, [warehouseId, warehouseOptions]);

  const selectedWarehouse = warehouseOptions.find((warehouse) => warehouse.id === warehouseId);

  const query: LocationListQuery = {
    page,
    limit: PAGE_SIZE,
    sort: 'path',
    ...(warehouseId ? { warehouseId } : {}),
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useLocationList(query, Boolean(warehouseId));
  const archive = useArchiveLocation();
  const restore = useRestoreLocation();
  const remove = useDeleteLocation();

  const rows = data?.data ?? [];
  const meta = data?.meta.page;
  const columnCount = 6; // Path · Name · Type · Status · Updated · Actions
  const confirmPending = archive.isPending || restore.isPending || remove.isPending;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(row: LocationResponse) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, row } = confirm;
    try {
      if (kind === 'archive') {
        await archive.mutateAsync(row.id);
        toast.success('Location archived');
      } else if (kind === 'restore') {
        await restore.mutateAsync(row.id);
        toast.success('Location restored');
      } else {
        await remove.mutateAsync(row.id);
        toast.success('Location deleted');
      }
      setConfirm(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const noWarehouses = !warehouses.isLoading && warehouseOptions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Zones, aisles, shelves and bins within a warehouse. Stock is tracked at a location.
          </p>
        </div>
        <Button leadingIcon={AddIcon} onClick={openCreate} disabled={!warehouseId}>
          New location
        </Button>
      </header>

      {noWarehouses ? (
        <ErrorState
          title="No warehouses yet"
          description="Create a warehouse first, then add its locations."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={warehouseId}
              onValueChange={(value) => {
                setWarehouseId(value);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Warehouse" className="sm:w-64" placeholder="Select a warehouse" />
              <SelectContent>
                {warehouseOptions.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="sm:max-w-xs sm:flex-1">
              <Search
                defaultValue={q}
                onSearch={(value) => {
                  setQ(value);
                  setPage(1);
                }}
                placeholder="Search locations…"
                aria-label="Search locations"
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
              title="Couldn’t load locations"
              description={errorMessage(error)}
              onRetry={() => void refetch()}
            />
          ) : (
            <>
              <div className="rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
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
                          No locations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-xs">{row.path}</TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-muted-foreground">{TYPE_LABEL[row.type] ?? row.type}</TableCell>
                          <TableCell>
                            <ResourceStatusBadge status={row.status} />
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
                                <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'restore', row })}>
                                  Restore
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'archive', row })}>
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
                    {meta.total} {meta.total === 1 ? 'location' : 'locations'}
                  </p>
                  {meta.totalPages > 1 ? (
                    <Pagination page={meta.page} pageCount={meta.totalPages} onPageChange={setPage} size="sm" />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      <LocationFormDialog
        open={dialogOpen}
        editing={editing}
        warehouseId={warehouseId}
        warehouseName={selectedWarehouse?.name ?? 'this warehouse'}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={confirm?.kind === 'archive'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Archive this location?"
        description="It will be hidden from pickers but kept for history. You can restore it later."
        confirmLabel="Archive"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'restore'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Restore this location?"
        description="It becomes selectable again."
        confirmLabel="Restore"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete this location?"
        description="Soft-deletes it and frees the code for reuse. A location with child locations can’t be deleted."
        confirmLabel="Delete"
        variant="destructive"
        loading={confirmPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}
