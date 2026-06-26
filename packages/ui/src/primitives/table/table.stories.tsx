import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

const meta: Meta<typeof Table> = {
  title: 'Data/Table',
  component: Table,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Table>;

interface Row {
  sku: string;
  name: string;
  status: 'in-stock' | 'low' | 'out';
  onHand: number;
}

const ROWS: Row[] = [
  { sku: 'SF-001', name: 'Wireless Mouse', status: 'in-stock', onHand: 128 },
  { sku: 'SF-002', name: 'Mechanical Keyboard', status: 'low', onHand: 9 },
  { sku: 'SF-003', name: 'USB-C Hub', status: 'out', onHand: 0 },
];

const TONE = {
  'in-stock': { tone: 'success', label: 'In stock' },
  low: { tone: 'warning', label: 'Low' },
  out: { tone: 'danger', label: 'Out' },
} as const;

export const Default: Story = {
  render: () => (
    <Table className="min-w-[32rem]">
      <TableCaption>Inventory snapshot</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">On hand</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.sku}>
            <TableCell className="font-medium">{row.sku}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status].tone} dot>
                {TONE[row.status].label}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.onHand}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total on hand</TableCell>
          <TableCell className="text-right tabular-nums">
            {ROWS.reduce((sum, r) => sum + r.onHand, 0)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const StickyHeader: Story = {
  render: () => (
    <Table
      wrapperClassName="max-h-64"
      className="min-w-[32rem] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-background"
    >
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">On hand</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 20 }, (_, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">SF-{String(i + 1).padStart(3, '0')}</TableCell>
            <TableCell>Item {i + 1}</TableCell>
            <TableCell className="text-right tabular-nums">{(i + 1) * 7}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
