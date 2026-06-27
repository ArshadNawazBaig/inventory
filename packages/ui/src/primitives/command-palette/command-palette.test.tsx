import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { CommandPalette, type CommandAction } from './command-palette';

const ACTIONS: CommandAction[] = [
  { id: 'products', label: 'Products', group: 'Navigation', onSelect: () => {} },
  { id: 'warehouses', label: 'Warehouses', group: 'Navigation', keywords: ['locations'], onSelect: () => {} },
  { id: 'create', label: 'Create product', group: 'Actions', shortcut: 'C', onSelect: () => {} },
];

describe('CommandPalette', () => {
  it('opens with the ⌘K hotkey and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CommandPalette actions={ACTIONS} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders grouped actions with headings', () => {
    render(<CommandPalette open onOpenChange={() => {}} actions={ACTIONS} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Create product/ })).toBeInTheDocument();
  });

  it('filters items by query', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onOpenChange={() => {}} actions={ACTIONS} />);
    await user.type(screen.getByPlaceholderText(/type a command/i), 'create');

    expect(screen.getByRole('option', { name: /Create product/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Products' })).not.toBeInTheDocument();
  });

  it('matches on keywords', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onOpenChange={() => {}} actions={ACTIONS} />);
    await user.type(screen.getByPlaceholderText(/type a command/i), 'locations');
    expect(screen.getByRole('option', { name: 'Warehouses' })).toBeInTheDocument();
  });

  it('runs an action and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        actions={[{ id: 'c', label: 'Create product', onSelect }]}
      />,
    );
    await user.click(screen.getByRole('option', { name: 'Create product' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the empty message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<CommandPalette open onOpenChange={() => {}} actions={ACTIONS} />);
    await user.type(screen.getByPlaceholderText(/type a command/i), 'zzzzz');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('has no accessibility violations when open', async () => {
    render(<CommandPalette open onOpenChange={() => {}} actions={ACTIONS} />);
    await screen.findByRole('dialog');
    await screen.findByRole('option', { name: 'Products' }); // wait for cmdk to populate the listbox
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
