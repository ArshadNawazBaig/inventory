import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders a switch', () => {
    render(<Switch aria-label="Auto-reorder" />);
    expect(screen.getByRole('switch', { name: 'Auto-reorder' })).toBeInTheDocument();
  });

  it('toggles on click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Auto-reorder" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('works as a controlled switch', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="Auto-reorder" checked={false} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles with the keyboard (Space)', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Auto-reorder" />);
    const toggle = screen.getByRole('switch');
    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Auto-reorder" disabled />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it('forwards the ref to the control', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Switch aria-label="Auto-reorder" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has no accessibility violations when labeled (aria-labelledby, as Field wires it)', async () => {
    const { container } = render(
      <>
        <span id="ar-label">Auto-reorder</span>
        <Switch aria-labelledby="ar-label" />
      </>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
