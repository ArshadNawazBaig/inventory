import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Filters, type FilterDef } from './filters';
import { FilterChip } from './filter-chip';

const STATUS: FilterDef = {
  id: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
  ],
};
const WAREHOUSE: FilterDef = {
  id: 'warehouse',
  label: 'Warehouse',
  type: 'multiselect',
  options: [
    { value: 'a', label: 'Warehouse A' },
    { value: 'b', label: 'Warehouse B' },
  ],
};
const NAME: FilterDef = { id: 'name', label: 'Name', type: 'text', placeholder: 'Contains…' };

describe('Filters', () => {
  it('adds a select filter via the add menu and reports the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters filters={[STATUS]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(screen.getByText('Status')); // add-menu item
    await user.click(screen.getByText('Active')); // editor option

    expect(onChange).toHaveBeenCalledWith({ status: 'active' });
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('builds a multiselect value and shows the count', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters filters={[WAREHOUSE]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(screen.getByText('Warehouse'));
    await user.click(screen.getByRole('checkbox', { name: 'Warehouse A' }));
    expect(onChange).toHaveBeenLastCalledWith({ warehouse: ['a'] });
    await user.click(screen.getByRole('checkbox', { name: 'Warehouse B' }));
    expect(onChange).toHaveBeenLastCalledWith({ warehouse: ['a', 'b'] });
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('sets a text filter value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters filters={[NAME]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(screen.getByText('Name'));
    await user.type(screen.getByRole('textbox'), 'bolt');

    expect(onChange).toHaveBeenLastCalledWith({ name: 'bolt' });
  });

  it('removes a filter with the chip ✕', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters filters={[STATUS]} defaultValue={{ status: 'active' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove Status filter' }));
    expect(onChange).toHaveBeenCalledWith({});
    expect(screen.queryByText('Status:')).not.toBeInTheDocument();
  });

  it('clears all active filters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Filters
        filters={[STATUS, WAREHOUSE]}
        defaultValue={{ status: 'active', warehouse: ['a'] }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Filters filters={[STATUS, NAME]} defaultValue={{ status: 'active' }} />,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('FilterChip', () => {
  it('renders label/value and fires onRemove', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<FilterChip label="Status" value="Active" onRemove={onRemove} removeLabel="Remove Status" />);
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Status' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
