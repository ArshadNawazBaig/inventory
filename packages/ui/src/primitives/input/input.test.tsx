import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from './input';

describe('Input', () => {
  it('renders a textbox', () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('accepts typing (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await user.type(input, 'Widget');
    expect(input.value).toBe('Widget');
  });

  it('works as a controlled input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Name" value="abc" onChange={onChange} />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    expect(input.value).toBe('abc');
    await user.type(input, 'd');
    expect(onChange).toHaveBeenCalled();
  });

  it('sets aria-invalid when invalid', () => {
    render(<Input aria-label="SKU" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables editing when disabled', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" disabled />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    expect(input).toBeDisabled();
    await user.type(input, 'x');
    expect(input.value).toBe('');
  });

  it('readOnly allows focus but not editing', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="On hand" readOnly defaultValue="42" />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await user.type(input, '9');
    expect(input.value).toBe('42');
  });

  it('clears the value via the clear button', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Search" clearable defaultValue="hello" />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    const clear = screen.getByRole('button', { name: 'Clear' });
    await user.click(clear);
    expect(input.value).toBe('');
    expect(input).toHaveFocus();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Password" type="password" defaultValue="secret" />);
    const input = screen.getByLabelText<HTMLInputElement>('Password');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('shows a spinner and hides the clear button while loading', () => {
    render(<Input aria-label="Search" clearable loading defaultValue="x" />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('forwards the ref to the input element', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations when labeled', async () => {
    const { container } = render(
      <label>
        Email
        <Input type="email" />
      </label>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
