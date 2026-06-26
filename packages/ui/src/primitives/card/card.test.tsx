import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  it('renders composed parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Product</CardTitle>
          <CardDescription>SKU-001</CardDescription>
        </CardHeader>
        <CardContent>120 in stock</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.getByText('120 in stock')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies the elevated variant', () => {
    const { container } = render(<Card variant="elevated">x</Card>);
    expect(container.firstChild).toHaveClass('shadow-md');
  });

  it('applies interactive affordances', () => {
    const { container } = render(<Card interactive>x</Card>);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('merges a custom className', () => {
    const { container } = render(<Card className="custom-x">x</Card>);
    expect(container.firstChild).toHaveClass('custom-x');
  });

  it('renders as a link via asChild', () => {
    render(
      <Card asChild interactive>
        <a href="/products/1">View product</a>
      </Card>,
    );
    expect(screen.getByRole('link', { name: 'View product' })).toHaveClass('cursor-pointer');
  });

  it('forwards the ref to the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>x</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
