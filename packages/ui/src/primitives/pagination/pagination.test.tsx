import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Pagination } from './pagination';
import { getPaginationRange } from './use-pagination-range';

describe('getPaginationRange', () => {
  it('brackets the current page with ellipses on both sides', () => {
    expect(getPaginationRange({ page: 5, pageCount: 10 })).toEqual([
      1,
      'start-ellipsis',
      4,
      5,
      6,
      'end-ellipsis',
      10,
    ]);
  });

  it('omits the leading ellipsis near the start', () => {
    const result = getPaginationRange({ page: 2, pageCount: 10 });
    expect(result).not.toContain('start-ellipsis');
    expect(result).toContain('end-ellipsis');
    expect(result.slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('lists every page (no ellipsis) when they all fit', () => {
    expect(getPaginationRange({ page: 1, pageCount: 3 })).toEqual([1, 2, 3]);
  });

  it('returns an empty range when there are no pages', () => {
    expect(getPaginationRange({ page: 1, pageCount: 0 })).toEqual([]);
  });
});

describe('Pagination', () => {
  it('renders a labelled navigation landmark', () => {
    render(<Pagination page={1} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination page={3} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('disables the previous arrow on the first page', () => {
    render(<Pagination page={1} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeEnabled();
  });

  it('disables the next arrow on the last page', () => {
    render(<Pagination page={5} pageCount={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('calls onPageChange with the clicked page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('advances with the next arrow', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders nothing when there are no pages', () => {
    const { container } = render(<Pagination page={1} pageCount={0} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Pagination page={5} pageCount={10} onPageChange={vi.fn()} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
