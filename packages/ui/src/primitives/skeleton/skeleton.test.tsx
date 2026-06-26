import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Skeleton, SkeletonText } from './skeleton';

describe('Skeleton', () => {
  it('renders a muted, pulsing, decorative block by default', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-muted', 'rounded-md', 'animate-pulse', 'h-10', 'w-10');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the circle and text variants', () => {
    const { container, rerender } = render(<Skeleton variant="circle" />);
    expect(container.firstChild).toHaveClass('rounded-full');
    rerender(<Skeleton variant="text" />);
    expect(container.firstChild).toHaveClass('h-4', 'w-full');
  });

  it('supports shimmer and none animations', () => {
    const { container, rerender } = render(<Skeleton animation="shimmer" />);
    expect(container.firstChild).toHaveClass('before:animate-skeleton-shimmer');
    expect(container.firstChild).not.toHaveClass('animate-pulse');
    rerender(<Skeleton animation="none" />);
    expect(container.firstChild).not.toHaveClass('animate-pulse');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe('SkeletonText', () => {
  it('renders three lines by default with a shortened last line', () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children).toHaveLength(3);
    const last = wrapper.children[2] as HTMLElement;
    expect(last.style.width).toBe('60%');
  });

  it('honours a custom line count and last-line width', () => {
    const { container } = render(<SkeletonText lines={5} lastLineWidth="40%" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children).toHaveLength(5);
    expect((wrapper.children[4] as HTMLElement).style.width).toBe('40%');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SkeletonText lines={4} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
