import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

function BasicDialog(props: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>Update the product details.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('opens via the trigger', async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Edit product' })).toBeInTheDocument();
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders open when controlled', () => {
    render(<BasicDialog open onOpenChange={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Edit product' })).toBeInTheDocument();
  });

  it('applies the size max-width class', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent size="sm">
          <DialogTitle>Small</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
  });

  it('has no accessibility violations when open', async () => {
    render(<BasicDialog open onOpenChange={() => {}} />);
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
