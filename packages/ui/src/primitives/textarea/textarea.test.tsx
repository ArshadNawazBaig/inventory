import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a textbox', () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });

  it('accepts typing (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" />);
    const el = screen.getByRole<HTMLTextAreaElement>('textbox');
    await user.type(el, 'line one{enter}line two');
    expect(el.value).toBe('line one\nline two');
  });

  it('works as a controlled textarea', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" value="abc" onChange={onChange} />);
    const el = screen.getByRole<HTMLTextAreaElement>('textbox');
    expect(el.value).toBe('abc');
    await user.type(el, 'd');
    expect(onChange).toHaveBeenCalled();
  });

  it('sets aria-invalid when invalid', () => {
    render(<Textarea aria-label="Notes" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables editing when disabled', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" disabled />);
    const el = screen.getByRole<HTMLTextAreaElement>('textbox');
    expect(el).toBeDisabled();
    await user.type(el, 'x');
    expect(el.value).toBe('');
  });

  it('readOnly allows focus but not editing', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" readOnly defaultValue="locked" />);
    const el = screen.getByRole<HTMLTextAreaElement>('textbox');
    await user.type(el, 'more');
    expect(el.value).toBe('locked');
  });

  it('defaults rows to minRows', () => {
    render(<Textarea aria-label="Notes" minRows={5} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
  });

  it('allows manual vertical resize by default', () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByRole('textbox')).toHaveClass('resize-y');
  });

  it('forces no manual resize and manages overflow when autoResize is set', () => {
    render(<Textarea aria-label="Notes" autoResize defaultValue="hello" />);
    const el = screen.getByRole<HTMLTextAreaElement>('textbox');
    expect(el).toHaveClass('resize-none');
    expect(el.style.overflowY).toBe('hidden');
    expect(el.style.height).not.toBe('');
  });

  it('forwards the ref to the textarea element', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea aria-label="Notes" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('has no accessibility violations when labeled', async () => {
    const { container } = render(
      <label>
        Description
        <Textarea />
      </label>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
