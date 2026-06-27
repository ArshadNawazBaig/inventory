import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Field, FieldControl } from './field';
import { Input } from '../input';

describe('Field', () => {
  it('associates the label with the control', () => {
    render(
      <Field label="Product name">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    // getByLabelText resolves the htmlFor ↔ id wiring.
    expect(screen.getByLabelText('Product name')).toBeInstanceOf(HTMLInputElement);
  });

  it('links a description via aria-describedby', () => {
    render(
      <Field label="SKU" description="Letters, numbers, hyphens.">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    const input = screen.getByLabelText('SKU');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const description = screen.getByText('Letters, numbers, hyphens.');
    expect(description).toHaveAttribute('id', describedBy);
  });

  it('reports an error: invalid state + aria-describedby points at the message', () => {
    render(
      <Field label="SKU" error="SKU is required">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    const input = screen.getByLabelText('SKU');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const message = screen.getByText('SKU is required');
    expect(input.getAttribute('aria-describedby')).toBe(message.getAttribute('id'));
  });

  it('hides the description while an error is shown', () => {
    render(
      <Field label="SKU" description="A hint" error="Bad SKU">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    expect(screen.queryByText('A hint')).not.toBeInTheDocument();
    expect(screen.getByText('Bad SKU')).toBeInTheDocument();
  });

  it('marks required controls', () => {
    render(
      <Field label="Name" required>
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    // The accessible name excludes the aria-hidden "*", so it stays exactly "Name".
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-required', 'true');
  });

  it('respects an explicit htmlFor id', () => {
    render(
      <Field label="Name" htmlFor="custom-id">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'custom-id');
  });

  it('throws when a part is used outside Field', () => {
    // Suppress React's error boundary console noise for this expected throw.
    expect(() =>
      render(
        <FieldControl>
          <Input />
        </FieldControl>,
      ),
    ).toThrow(/inside <Field>/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Field label="SKU" description="A short code" required error="SKU is required">
        <FieldControl>
          <Input />
        </FieldControl>
      </Field>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
