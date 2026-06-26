import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { RadioGroup, RadioGroupItem } from './radio';
import type { ComponentProps } from 'react';

function BasicRadio(props: ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Costing method" {...props}>
      <RadioGroupItem value="fifo">FIFO</RadioGroupItem>
      <RadioGroupItem value="lifo">LIFO</RadioGroupItem>
      <RadioGroupItem value="average" disabled>
        Weighted average
      </RadioGroupItem>
    </RadioGroup>
  );
}

describe('Radio', () => {
  it('renders a radiogroup with radios', () => {
    render(<BasicRadio />);
    expect(screen.getByRole('radiogroup', { name: 'Costing method' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('selects an option on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicRadio onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: 'LIFO' }));
    expect(onValueChange).toHaveBeenCalledWith('lifo');
    expect(screen.getByRole('radio', { name: 'LIFO' })).toBeChecked();
  });

  it('moves focus with arrow keys (roving tabindex)', async () => {
    const user = userEvent.setup();
    render(<BasicRadio defaultValue="fifo" />);
    screen.getByRole('radio', { name: 'FIFO' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'LIFO' })).toHaveFocus();
  });

  it('disables an individual item', () => {
    render(<BasicRadio />);
    expect(screen.getByRole('radio', { name: 'Weighted average' })).toBeDisabled();
  });

  it('sets aria-invalid on the group when invalid', () => {
    render(<BasicRadio invalid />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards the ref to an item', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <RadioGroup aria-label="Method">
        <RadioGroupItem ref={ref} value="a">
          A
        </RadioGroupItem>
      </RadioGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicRadio />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
