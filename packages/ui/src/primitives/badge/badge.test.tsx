import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AddIcon } from '@stockflow/icons';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>In stock</Badge>);
    expect(screen.getByText('In stock')).toBeInTheDocument();
  });

  it('applies tone + appearance classes', () => {
    render(<Badge tone="success">In stock</Badge>);
    expect(screen.getByText('In stock')).toHaveClass('text-success');
  });

  it('applies solid appearance classes', () => {
    render(<Badge tone="primary" appearance="solid">New</Badge>);
    expect(screen.getByText('New')).toHaveClass('bg-primary');
  });

  it('renders a leading status dot', () => {
    const { container } = render(<Badge dot>Online</Badge>);
    expect(container.querySelector('.bg-current')).toBeInTheDocument();
  });

  it('renders a leading icon', () => {
    const { container } = render(<Badge leadingIcon={AddIcon}>New</Badge>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards the ref to the span', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Badge ref={ref}>Label</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge tone="warning" dot>Low stock</Badge>);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
