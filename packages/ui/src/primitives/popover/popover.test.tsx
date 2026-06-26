import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover';

function BasicPopover(props: React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Details">
        <p>Popover body</p>
        <PopoverClose>Close</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('opens via the trigger', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    expect(screen.queryByText('Popover body')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('toggles aria-expanded on the trigger', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Popover body')).not.toBeInTheDocument());
  });

  it('closes via PopoverClose', async () => {
    const user = userEvent.setup();
    render(<BasicPopover />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Popover body')).not.toBeInTheDocument());
  });

  it('renders open when controlled', () => {
    render(<BasicPopover open onOpenChange={() => {}} />);
    expect(screen.getByText('Popover body')).toBeInTheDocument();
  });

  it('has no accessibility violations when open', async () => {
    render(<BasicPopover open onOpenChange={() => {}} />);
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
