import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
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

function ProductsTable() {
  return (
    <Table>
      <TableCaption>Products</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">On hand</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>SF-001</TableCell>
          <TableCell>Wireless Mouse</TableCell>
          <TableCell className="text-right tabular-nums">128</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>SF-002</TableCell>
          <TableCell>Mechanical Keyboard</TableCell>
          <TableCell className="text-right tabular-nums">64</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell className="text-right tabular-nums">192</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('renders a table with an accessible caption', () => {
    render(<ProductsTable />);
    expect(screen.getByRole('table', { name: 'Products' })).toBeInTheDocument();
  });

  it('renders column headers with scope="col"', () => {
    render(<ProductsTable />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    headers.forEach((h) => expect(h).toHaveAttribute('scope', 'col'));
  });

  it('renders body rows and cells', () => {
    render(<ProductsTable />);
    expect(screen.getByRole('cell', { name: 'Wireless Mouse' })).toBeInTheDocument();
    // 2 body rows + 1 footer row (header row is a separate rowgroup)
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('reflects the selected state on a row', () => {
    render(<ProductsTable />);
    const selected = screen.getByRole('cell', { name: 'SF-001' }).closest('tr');
    expect(selected).toHaveAttribute('data-state', 'selected');
  });

  it('supports an overridden header scope', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Row header</TableHead>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('rowheader', { name: 'Row header' })).toHaveAttribute('scope', 'row');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProductsTable />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
