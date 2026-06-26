import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, type BadgeTone } from '../badge';
import { DataGrid } from './data-grid';

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

const COLUMNS: ColumnDef<Product>[] = [
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
];

const meta: Meta<typeof DataGrid<Product>> = {
  title: 'Data/DataGrid',
  component: DataGrid,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DataGrid<Product>>;

export const Default: Story = {
  render: () => <DataGrid columns={COLUMNS} data={DATA} caption="Inventory" captionSrOnly />,
};

export const Selectable: Story = {
  render: () => (
    <DataGrid
      columns={COLUMNS}
      data={DATA}
      enableRowSelection
      getRowId={(row) => row.sku}
      caption="Inventory"
      captionSrOnly
    />
  ),
};

export const Loading: Story = {
  render: () => <DataGrid columns={COLUMNS} data={[]} loading caption="Inventory" captionSrOnly />,
};

export const Empty: Story = {
  render: () => (
    <DataGrid
      columns={COLUMNS}
      data={[]}
      caption="Inventory"
      captionSrOnly
      emptyState="No products match your filters."
    />
  ),
};
