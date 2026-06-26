'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataGrid,
  type BadgeTone,
  type ColumnDef,
} from '@stockflow/ui';
import { CodeBlock } from '../_ui/code-block';
import { Block, Guidelines, PropsTable, ShowcasePage, type PropRow } from '../_ui/showcase';

interface Product {
  sku: string;
  name: string;
  status: 'in-stock' | 'low' | 'out';
  onHand: number;
}

const TONE: Record<Product['status'], { tone: BadgeTone; label: string }> = {
  'in-stock': { tone: 'success', label: 'In stock' },
  low: { tone: 'warning', label: 'Low' },
  out: { tone: 'danger', label: 'Out' },
};

const DATA: Product[] = Array.from({ length: 23 }, (_, i) => {
  const onHand = (i * 13) % 140;
  const status: Product['status'] = onHand === 0 ? 'out' : onHand < 20 ? 'low' : 'in-stock';
  return { sku: `SF-${String(i + 1).padStart(3, '0')}`, name: `Product ${i + 1}`, status, onHand };
});

const USAGE = `import { DataGrid, type ColumnDef } from '@stockflow/ui';

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => row.original.sku },
  { accessorKey: 'name', header: 'Product', cell: ({ row }) => row.original.name },
  { accessorKey: 'onHand', header: 'On hand',
    cell: ({ row }) => <span className="tabular-nums">{row.original.onHand}</span> },
];

<DataGrid
  columns={columns}
  data={products}
  caption="Inventory"
  captionSrOnly
  enableRowSelection
  getRowId={(row) => row.sku}
  pageSize={10}
  onRowSelectionChange={setSelected}
/>`;

const PROPS: PropRow[] = [
  { name: 'columns', type: 'ColumnDef<TData>[]', description: 'TanStack column defs (accessorKey/header/cell).' },
  { name: 'data', type: 'TData[]', description: 'Row data.' },
  { name: 'caption / captionSrOnly', type: 'string / boolean', description: 'Accessible table name; optionally visually hidden.' },
  { name: 'enableSorting', type: 'boolean', default: 'true', description: 'Client-side column sorting (click a header).' },
  { name: 'enableRowSelection / onRowSelectionChange / getRowId', type: 'boolean / fn / fn', description: 'Checkbox column; emits selected rows; stable ids.' },
  { name: 'enablePagination / pageSize', type: 'boolean / number', default: 'true / 10', description: 'Client-side pagination via the Pagination component.' },
  { name: 'loading / loadingRowCount', type: 'boolean / number', description: 'Skeleton rows while data loads.' },
  { name: 'emptyState', type: 'ReactNode', default: "'No results.'", description: 'Shown when there are no rows.' },
];

export default function DataGridShowcase() {
  const [selected, setSelected] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => <span className="font-medium">{row.original.sku}</span> },
      { accessorKey: 'name', header: 'Product', cell: ({ row }) => row.original.name },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={TONE[row.original.status].tone} dot>
            {TONE[row.original.status].label}
          </Badge>
        ),
      },
      {
        accessorKey: 'onHand',
        header: 'On hand',
        cell: ({ row }) => <span className="tabular-nums">{row.original.onHand}</span>,
      },
    ],
    [],
  );

  return (
    <ShowcasePage
      title="DataGrid"
      description="The smart table: TanStack-powered sorting, row selection, and pagination over the Table primitives, with loading and empty states. Toggle dark mode from the sidebar."
    >
      <Block title="Usage">
        <CodeBlock code={USAGE} />
      </Block>

      <Block title="Live demo — sortable, selectable, paginated">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={loading ? 'primary' : 'outline'} onClick={() => setLoading((v) => !v)}>
            {loading ? 'Stop loading' : 'Simulate loading'}
          </Button>
          <Button size="sm" variant={empty ? 'primary' : 'outline'} onClick={() => setEmpty((v) => !v)}>
            {empty ? 'Show data' : 'Show empty state'}
          </Button>
          <span className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selected.length}</span>
            {selected.length > 0 ? ` (${selected.map((p) => p.sku).join(', ')})` : ''}
          </span>
        </div>
        <DataGrid
          columns={columns}
          data={empty ? [] : DATA}
          caption="Inventory"
          captionSrOnly
          enableRowSelection
          getRowId={(row) => row.sku}
          onRowSelectionChange={setSelected}
          pageSize={8}
          loading={loading}
          emptyState="No products match your filters."
        />
      </Block>

      <Block title="Props">
        <PropsTable rows={PROPS} />
      </Block>

      <Block title="Guidelines">
        <Guidelines
          items={[
            <>
              Define <code className="font-mono">columns</code> once (memoized) and pass{' '}
              <code className="font-mono">data</code>; DataGrid handles sorting, selection, and
              pagination over the <strong>Table</strong> primitives.
            </>,
            <>
              Provide a stable <code className="font-mono">getRowId</code> when selecting so selection
              survives re-sorts and page changes; selected rows flow through{' '}
              <code className="font-mono">onRowSelectionChange</code>.
            </>,
            <>
              Always name the grid with <code className="font-mono">caption</code> (use{' '}
              <code className="font-mono">captionSrOnly</code> when a visible heading exists); sortable
              headers expose <code className="font-mono">aria-sort</code>.
            </>,
            <>
              This is <strong>client-side</strong> by default — great up to a few thousand rows. For
              100k+ SKUs, drive <code className="font-mono">data</code> server-side (manual sorting /
              pagination) per the spec.
            </>,
          ]}
        />
      </Block>
    </ShowcasePage>
  );
}
