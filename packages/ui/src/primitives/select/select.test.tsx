import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Select, SelectContent, SelectItem, SelectTrigger } from './select';
import type { ComponentProps } from 'react';

function BasicSelect(props: ComponentProps<typeof Select>) {
  return (
    <Select {...props}>
      <SelectTrigger aria-label="Costing method" placeholder="Select a method" />
      <SelectContent>
        <SelectItem value="fifo">FIFO</SelectItem>
        <SelectItem value="lifo">LIFO</SelectItem>
        <SelectItem value="average" disabled>
          Weighted average
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select', () => {
  it('renders a combobox trigger showing the placeholder', () => {
    render(<BasicSelect />);
    const trigger = screen.getByRole('combobox', { name: 'Costing method' });
    expect(trigger).toHaveTextContent('Select a method');
  });

  it('displays the selected value when controlled', () => {
    render(<BasicSelect value="fifo" onValueChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('FIFO');
  });

  it('sets aria-invalid on the trigger when invalid', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Method" invalid placeholder="Select" />
        <SelectContent>
          <SelectItem value="fifo">FIFO</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables the trigger when disabled', () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Method" placeholder="Select" />
        <SelectContent>
          <SelectItem value="fifo">FIFO</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('forwards the ref to the trigger button', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Select>
        <SelectTrigger ref={ref} aria-label="Method" placeholder="Select" />
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('opens and selects an option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'LIFO' }));

    expect(onValueChange).toHaveBeenCalledWith('lifo');
  });

  it('marks a disabled option as disabled', async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);

    await user.click(screen.getByRole('combobox'));
    const disabledOption = await screen.findByRole('option', { name: 'Weighted average' });
    expect(disabledOption).toHaveAttribute('data-disabled');
  });

  it('has no accessibility violations (closed)', async () => {
    const { container } = render(<BasicSelect />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
