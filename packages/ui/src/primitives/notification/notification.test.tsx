import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Notification } from './notification';

describe('Notification', () => {
  it('renders the title, body, and a tone icon', () => {
    const { container } = render(
      <Notification tone="success" title="Saved">
        Your changes were stored.
      </Notification>,
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were stored.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('hides the icon when icon={null}', () => {
    const { container } = render(
      <Notification tone="info" icon={null} title="No icon" />,
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('uses role="alert" for error and role="status" otherwise', () => {
    const { rerender } = render(<Notification tone="error" title="Failed" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Notification tone="info" title="FYI" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a dismiss button only with onDismiss and fires it', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(<Notification title="No dismiss" />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();

    rerender(<Notification title="Dismiss me" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders an action node', () => {
    render(
      <Notification tone="warning" title="Low stock" action={<button type="button">Reorder</button>}>
        3 SKUs below threshold.
      </Notification>,
    );
    expect(screen.getByRole('button', { name: 'Reorder' })).toBeInTheDocument();
  });

  it('applies the solid filled surface', () => {
    const { container } = render(<Notification tone="error" appearance="solid" title="Down" />);
    expect(container.firstChild).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('has no accessibility violations (soft and solid)', async () => {
    const { container, rerender } = render(
      <Notification tone="success" title="Saved" onDismiss={() => {}}>
        All good.
      </Notification>,
    );
    expect((await axe(container)).violations).toEqual([]);

    rerender(
      <Notification tone="error" appearance="solid" title="Failed">
        Try again.
      </Notification>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
