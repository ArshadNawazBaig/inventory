import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Tooltip } from './tooltip';

function BasicTooltip() {
  return (
    <Tooltip content="Add a product">
      <button type="button">Add</button>
    </Tooltip>
  );
}

// `region` is a page-level landmark rule, irrelevant to an isolated component test.
const axeOptions = { rules: { region: { enabled: false } } };

describe('Tooltip', () => {
  it('renders the trigger', () => {
    render(<BasicTooltip />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('shows the tip on hover', async () => {
    const user = userEvent.setup();
    render(<BasicTooltip />);
    const trigger = screen.getByRole('button', { name: 'Add' });
    expect(trigger).toHaveAttribute('data-state', 'closed');
    await user.hover(trigger);
    await waitFor(() => expect(trigger).not.toHaveAttribute('data-state', 'closed'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Add a product');
  });

  it('shows the tip on keyboard focus', async () => {
    const user = userEvent.setup();
    render(<BasicTooltip />);
    const trigger = screen.getByRole('button', { name: 'Add' });
    await user.tab();
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(trigger).not.toHaveAttribute('data-state', 'closed'));
  });

  it('hides the tip on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicTooltip />);
    const trigger = screen.getByRole('button', { name: 'Add' });
    await user.hover(trigger);
    await waitFor(() => expect(trigger).not.toHaveAttribute('data-state', 'closed'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('data-state', 'closed'));
  });

  it('describes the trigger via aria-describedby when open', async () => {
    const user = userEvent.setup();
    render(<BasicTooltip />);
    const trigger = screen.getByRole('button', { name: 'Add' });
    await user.hover(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-describedby'));
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(<BasicTooltip />);
    await user.hover(screen.getByRole('button', { name: 'Add' }));
    await screen.findByRole('tooltip');
    const results = await axe(document.body, axeOptions);
    expect(results.violations).toEqual([]);
  });
});
