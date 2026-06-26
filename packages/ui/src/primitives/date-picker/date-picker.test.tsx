import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { DatePicker } from './date-picker';

const JUNE_10 = new Date(2026, 5, 10);
const JUNE_15 = new Date(2026, 5, 15);

describe('DatePicker', () => {
  it('renders the placeholder when empty', () => {
    render(<DatePicker />);
    expect(screen.getByRole('button', { name: /pick a date/i })).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('opens the calendar when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue={JUNE_15} aria-label="Date" />);
    const trigger = screen.getByRole('button', { name: 'Date' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('selects a day: calls onChange, updates the label, and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker defaultValue={JUNE_15} onChange={onChange} aria-label="Date" />);
    await user.click(screen.getByRole('button', { name: 'Date' }));

    const day16 = document.querySelector('[data-day="2026-06-16"] button');
    expect(day16).not.toBeNull();
    await user.click(day16 as HTMLElement);

    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]?.[0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getDate()).toBe(16);
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
    expect(screen.getByText('Jun 16, 2026')).toBeInTheDocument();
  });

  it('clears the value via the clear button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker defaultValue={JUNE_15} clearable onChange={onChange} aria-label="Date" />);
    expect(screen.getByText('Jun 15, 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('reflects a controlled value', () => {
    render(<DatePicker value={JUNE_15} aria-label="Date" />);
    expect(screen.getByText('Jun 15, 2026')).toBeInTheDocument();
  });

  it('picks a from/to range and shows both ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="range"
        defaultValue={{ from: JUNE_10, to: undefined }}
        onChange={onChange}
        aria-label="Range"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Range' }));

    const day15 = document.querySelector('[data-day="2026-06-15"] button');
    expect(day15).not.toBeNull();
    await user.click(day15 as HTMLElement);

    expect(onChange).toHaveBeenCalled();
    const range = onChange.mock.calls.at(-1)?.[0] as { from?: Date; to?: Date };
    expect(range.from?.getDate()).toBe(10);
    expect(range.to?.getDate()).toBe(15);
    await waitFor(() => expect(screen.getByText(/Jun 10, 2026/)).toBeInTheDocument());
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<DatePicker disabled aria-label="Date" />);
    const trigger = screen.getByRole('button', { name: 'Date' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('has no accessibility violations (closed)', async () => {
    const { container } = render(<DatePicker defaultValue={JUNE_15} clearable aria-label="Date" />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('has no accessibility violations (open)', async () => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue={JUNE_15} aria-label="Date" />);
    await user.click(screen.getByRole('button', { name: 'Date' }));
    await screen.findByRole('grid');
    const results = await axe(document.body);
    expect(results.violations).toEqual([]);
  });
});
