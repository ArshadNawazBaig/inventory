import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Calendar } from './calendar';

const JUNE_2026 = new Date(2026, 5, 1);

describe('Calendar', () => {
  it('renders a month grid', () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2026} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders the month label and navigation', () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2026} />);
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument();
    // two nav buttons (previous / next)
    expect(screen.getAllByRole('button', { name: /month/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('marks the selected day with aria-selected', () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2026} selected={new Date(2026, 5, 15)} />);
    expect(screen.getByRole('gridcell', { selected: true })).toHaveAttribute(
      'data-day',
      '2026-06-15',
    );
  });

  it('calls onSelect with the clicked day', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar mode="single" defaultMonth={JUNE_2026} onSelect={onSelect} />,
    );
    const dayButton = container.querySelector('[data-day="2026-06-16"] button');
    expect(dayButton).not.toBeNull();
    await userEvent.click(dayButton as HTMLElement);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const arg = onSelect.mock.calls[0]?.[0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getDate()).toBe(16);
  });

  it('does not select a disabled day', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        defaultMonth={JUNE_2026}
        disabled={{ before: new Date(2026, 5, 15) }}
        onSelect={onSelect}
      />,
    );
    const disabledButton = container.querySelector('[data-day="2026-06-10"] button');
    expect(disabledButton).toBeDisabled();
    await userEvent.click(disabledButton as HTMLElement);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('drills down month/year → years → months → days from the header', async () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2026} />);
    // Click the caption to open the year grid.
    await userEvent.click(screen.getByRole('button', { name: /June 2026/i }));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    // Pick a year → month grid.
    await userEvent.click(screen.getByRole('button', { name: '2024' }));
    expect(screen.getByRole('button', { name: 'Mar' })).toBeInTheDocument();
    // Pick a month → back to the day grid for March 2024.
    await userEvent.click(screen.getByRole('button', { name: 'Mar' }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText(/March 2024/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Calendar mode="single" defaultMonth={JUNE_2026} selected={new Date(2026, 5, 15)} />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
