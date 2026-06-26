'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { Checkbox } from '../checkbox';
import { Pagination } from '../pagination';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

export interface DataGridProps<TData> {
  /** TanStack column definitions. */
  columns: ColumnDef<TData, unknown>[];
  /** Row data. */
  data: TData[];
  /** Accessible caption (use `captionSrOnly` to visually hide it). */
  caption?: string;
  /** Visually hide the caption (keep it for assistive tech). */
  captionSrOnly?: boolean;
  /** Enable column sorting (client-side). */
  enableSorting?: boolean;
  /** Add a leading checkbox column and emit selection changes. */
  enableRowSelection?: boolean;
  /** Called with the selected rows' original data whenever selection changes. */
  onRowSelectionChange?: (rows: TData[]) => void;
  /** Stable row id (recommended when selecting). */
  getRowId?: (row: TData, index: number) => string;
  /** Client-side pagination (default true). */
  enablePagination?: boolean;
  /** Rows per page (default 10). */
  pageSize?: number;
  /** Show skeleton rows instead of data. */
  loading?: boolean;
  /** Skeleton row count while loading (default = pageSize). */
  loadingRowCount?: number;
  /** Shown when there are no rows. */
  emptyState?: ReactNode;
  className?: string;
}

/**
 * DataGrid — the smart, TanStack-powered table: client-side sorting, row selection, and pagination over
 * the presentational Table primitives. Handles loading (skeleton) and empty states. For server-side
 * data, drive `data`/`pageCount` externally (manual mode) — see the spec. Spec: docs/components/data-grid.md.
 */
export function DataGrid<TData>({
  columns,
  data,
  caption,
  captionSrOnly = false,
  enableSorting = true,
  enableRowSelection = false,
  onRowSelectionChange,
  getRowId,
  enablePagination = true,
  pageSize = 10,
  loading = false,
  loadingRowCount,
  emptyState,
  className,
}: DataGridProps<TData>): React.JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: '__select__',
      enableSorting: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
          aria-label="Select row"
        />
      ),
    }),
    [],
  );

  const resolvedColumns = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [enableRowSelection, selectionColumn, columns],
  );

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableSorting,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    ...(getRowId ? { getRowId } : {}),
    initialState: enablePagination ? { pagination: { pageIndex: 0, pageSize } } : {},
  });

  useEffect(() => {
    if (!onRowSelectionChange) return;
    onRowSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // Emit only when the selection map changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const columnCount = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;
  const skeletonRows = loadingRowCount ?? pageSize;
  const pageCount = table.getPageCount();
  const showPagination = enablePagination && !loading && pageCount > 1;
  const showSelectionBar = enableRowSelection && !loading;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border border-border">
        <Table>
          {caption ? (
            <TableCaption className={cn(captionSrOnly && 'sr-only')}>{caption}</TableCaption>
          ) : null}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const ariaSort =
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined;
                  const content = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <TableHead key={header.id} aria-sort={ariaSort}>
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-sm font-medium text-muted-foreground transition-colors',
                            'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            '[&>svg]:size-3.5',
                          )}
                        >
                          {content}
                          {sorted === 'asc' ? (
                            <ChevronUpIcon aria-hidden="true" />
                          ) : sorted === 'desc' ? (
                            <ChevronDownIcon aria-hidden="true" />
                          ) : (
                            <ChevronsUpDownIcon className="opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        content
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                  {emptyState ?? 'No results.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showSelectionBar || showPagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          {showSelectionBar ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {table.getSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length}{' '}
              row(s) selected
            </p>
          ) : (
            <span />
          )}
          {showPagination ? (
            <Pagination
              page={table.getState().pagination.pageIndex + 1}
              pageCount={pageCount}
              onPageChange={(page) => table.setPageIndex(page - 1)}
              size="sm"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
