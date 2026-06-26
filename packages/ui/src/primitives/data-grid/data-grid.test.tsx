import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ColumnDef } from '@tanstack/react-table';
import { DataGrid } from './data-grid';

interface Product {
  sku: string;
  name: string;
  onHand: number;
}

const DATA: Product[] = [
  { sku: 'B', name: 'Banana', onHand: 5 },
  { sku: 'A', name: 'Apple', onHand: 9 },
  { sku: 'C', name: 'Cherry', onHand: 1 },
];

const COLUMNS: ColumnDef<Product>[] = [
  { accessorKey: 'sku', header: 'SKU', cell: ({ row }) => row.original.sku },
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name },
  { accessorKey: 'onHand', header: 'On hand', cell: ({ row }) => row.original.onHand },
];

function firstBodyRow() {
  // [0] is the header row.
  return screen.getAllByRole('row')[1] as HTMLElement;
}

describe('DataGrid', () => {
  it('renders rows from data', () => {
    render(<DataGrid columns={COLUMNS} data={DATA} caption="Products" />);
    expect(screen.getByRole('table', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Cherry' })).toBeInTheDocument();
  });

  it('sorts ascending when a sortable header is clicked', async () => {
    render(<DataGrid columns={COLUMNS} data={DATA} caption="Products" />);
    expect(within(firstBodyRow()).getByText('Banana')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(within(firstBodyRow()).getByText('Apple')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('paginates client-side', async () => {
    render(<DataGrid columns={COLUMNS} data={DATA} pageSize={2} caption="Products" />);
    // Page 1: first two rows.
    expect(screen.getByRole('cell', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Cherry' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(screen.getByRole('cell', { name: 'Cherry' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Banana' })).not.toBeInTheDocument();
  });

  it('emits selection changes when a row is selected', async () => {
    const onRowSelectionChange = vi.fn<(rows: Product[]) => void>();
    render(
      <DataGrid
        columns={COLUMNS}
        data={DATA}
        enableRowSelection
        getRowId={(row) => row.sku}
        onRowSelectionChange={onRowSelectionChange}
        caption="Products"
      />,
    );
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]!);
    expect(onRowSelectionChange).toHaveBeenLastCalledWith([DATA[0]]);
    expect(firstBodyRow()).toHaveAttribute('data-state', 'selected');
  });

  it('selects every row on the page via the header checkbox', async () => {
    const onRowSelectionChange = vi.fn<(rows: Product[]) => void>();
    render(
      <DataGrid
        columns={COLUMNS}
        data={DATA}
        enableRowSelection
        getRowId={(row) => row.sku}
        onRowSelectionChange={onRowSelectionChange}
        caption="Products"
      />,
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select all rows on this page' }),
    );
    expect(onRowSelectionChange).toHaveBeenLastCalledWith(DATA);
  });

  it('shows an empty state when there are no rows', () => {
    render(<DataGrid columns={COLUMNS} data={[]} caption="Products" emptyState="No products yet." />);
    expect(screen.getByText('No products yet.')).toBeInTheDocument();
  });

  it('shows skeleton rows while loading', () => {
    const { container } = render(
      <DataGrid columns={COLUMNS} data={DATA} loading loadingRowCount={3} caption="Products" />,
    );
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DataGrid columns={COLUMNS} data={DATA} enableRowSelection caption="Products" />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
