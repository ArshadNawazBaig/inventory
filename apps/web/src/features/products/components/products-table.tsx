'use client';

import Link from 'next/link';
import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stockflow/ui';
import { ChevronDownIcon, ChevronsUpDownIcon, ChevronUpIcon } from '@stockflow/icons';
import type { ListProductsQuery, ProductResponse } from '@stockflow/types';
import { ProductStatusBadge } from './status-badge';

export type ProductSort = ListProductsQuery['sort'];
type SortableField = 'name' | 'updatedAt';

export interface ProductsTableProps {
  products: ProductResponse[];
  loading: boolean;
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

/** Server-sortable column header — toggles between ascending/descending for its field. */
function SortableHead({
  label,
  field,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  field: SortableField;
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
  className?: string;
}) {
  const ascending = sort === field;
  const descending = sort === `-${field}`;
  const next: ProductSort = ascending ? `-${field}` : field;
  const Icon = ascending ? ChevronUpIcon : descending ? ChevronDownIcon : ChevronsUpDownIcon;
  const ariaSort = ascending ? 'ascending' : descending ? 'descending' : 'none';

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSortChange(next)}
        className="inline-flex items-center gap-1 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <Icon className={ascending || descending ? 'size-3.5' : 'size-3.5 opacity-50'} aria-hidden="true" />
      </button>
    </TableHead>
  );
}

const COLUMN_COUNT = 4;

/**
 * The product list grid. Sorting is **server-driven** (sort flows up to the query, not sorted in the
 * browser) so paging stays correct across the whole result set — TanStack's DataGrid only sorts the
 * current page, so we compose the lower-level Table primitives instead.
 */
export function ProductsTable({ products, loading, sort, onSortChange }: ProductsTableProps) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Name" field="name" sort={sort} onSortChange={onSortChange} />
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Variants</TableHead>
            <SortableHead
              label="Updated"
              field="updatedAt"
              sort={sort}
              onSortChange={onSortChange}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, row) => (
              <TableRow key={`skeleton-${row}`}>
                {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
                  <TableCell key={cell}>
                    <Skeleton variant="text" className="max-w-[160px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="h-24 text-center text-muted-foreground"
              >
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/products/${product.id}`}
                    className="rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{product.variantCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(product.updatedAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
