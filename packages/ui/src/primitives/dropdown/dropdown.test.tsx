import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown';

function BasicMenu({
  onSelect = () => {},
  onCheckedChange = () => {},
}: {
  onSelect?: () => void;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Manage</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
        <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
          Show archived
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// `region` is a page-level landmark rule, irrelevant to an isolated component test.
const axeOptions = { rules: { region: { enabled: false } } };

describe('DropdownMenu', () => {
  it('opens via the trigger', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('selects an item and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('toggles a checkbox item', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<BasicMenu onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Show archived' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('marks a disabled item as disabled', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Archive' })).toHaveAttribute('data-disabled');
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    const results = await axe(document.body, axeOptions);
    expect(results.violations).toEqual([]);
  });
});
