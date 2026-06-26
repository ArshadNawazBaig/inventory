import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Toaster } from './toast';
import { toast, clearToasts } from './toast-store';

// The store is a module singleton — reset it between tests.
afterEach(() => {
  act(() => clearToasts());
});

describe('Toast', () => {
  it('shows a toast pushed through the imperative API', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Product saved');
    });
    expect(await screen.findByText('Product saved')).toBeInTheDocument();
  });

  it('renders title and description', async () => {
    render(<Toaster />);
    act(() => {
      toast.error('Import failed', { description: 'Check the file format.' });
    });
    expect(await screen.findByText('Import failed')).toBeInTheDocument();
    expect(screen.getByText('Check the file format.')).toBeInTheDocument();
  });

  it('dismisses via the close button', async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    act(() => {
      toast('Heads up');
    });
    await screen.findByText('Heads up');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Heads up')).not.toBeInTheDocument());
  });

  it('fires the action button onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast('Item deleted', { action: { label: 'Undo', onClick, altText: 'Undo delete' } });
    });
    await screen.findByText('Item deleted');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('dismisses programmatically by id', async () => {
    render(<Toaster />);
    let id = '';
    act(() => {
      id = toast('Temporary');
    });
    await screen.findByText('Temporary');
    act(() => {
      toast.dismiss(id);
    });
    await waitFor(() => expect(screen.queryByText('Temporary')).not.toBeInTheDocument());
  });

  it('stacks multiple toasts', async () => {
    render(<Toaster />);
    act(() => {
      toast('One');
      toast('Two');
    });
    expect(await screen.findByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('has no accessibility violations with a toast open', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('Saved', { description: 'All changes stored.' });
    });
    await screen.findByText('Saved');
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
