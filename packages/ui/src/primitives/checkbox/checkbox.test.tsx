import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders a checkbox', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeInTheDocument();
  });

  it('toggles on click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('works as a controlled checkbox', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" checked={false} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('renders the indeterminate (mixed) state', () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" onCheckedChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('sets aria-invalid when invalid', () => {
    render(<Checkbox aria-label="Accept" invalid />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" disabled />);
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('toggles when its associated label is clicked', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="terms">Accept terms</label>
        <Checkbox id="terms" />
      </>,
    );
    await user.click(screen.getByText('Accept terms'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('forwards the ref to the control', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Checkbox aria-label="Accept" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has no accessibility violations when labeled (aria-labelledby, as Field wires it)', async () => {
    const { container } = render(
      <>
        <span id="opt-in-label">Email me updates</span>
        <Checkbox aria-labelledby="opt-in-label" />
      </>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
