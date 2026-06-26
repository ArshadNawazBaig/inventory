'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
} from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronLeftIcon, ChevronRightIcon, MoreIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { paginationButtonVariants, type PaginationButtonVariantProps } from './pagination.variants';
import { usePaginationRange } from './use-pagination-range';

export interface PaginationButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    PaginationButtonVariantProps {
  /** Render onto a child element (e.g. a Next `<Link>`). */
  asChild?: boolean;
  /** Current page — sets `aria-current="page"` and the primary fill. */
  isActive?: boolean;
}

/**
 * A single pagination cell — a numbered page (`variant="page"`) or an arrow (`variant="nav"`).
 * The library's low-level building block; compose these yourself, or use {@link Pagination}.
 */
export const PaginationButton = forwardRef<HTMLButtonElement, PaginationButtonProps>(
  function PaginationButton(
    { className, variant, size, asChild = false, isActive = false, ...props },
    ref,
  ) {
    const Comp: ElementType = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        data-active={isActive || undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(paginationButtonVariants({ variant, size }), className)}
        {...(asChild ? {} : { type: 'button' as const })}
        {...props}
      />
    );
  },
);

export interface PaginationEllipsisProps extends HTMLAttributes<HTMLSpanElement> {
  size?: PaginationButtonVariantProps['size'];
}

/** Decorative gap marker between page ranges (hidden from assistive tech). */
export const PaginationEllipsis = forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  function PaginationEllipsis({ className, size, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn(
          paginationButtonVariants({ variant: 'page', size }),
          'pointer-events-none text-muted-foreground',
          className,
        )}
        {...props}
      >
        <MoreIcon />
      </span>
    );
  },
);

export interface PaginationProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Called with the next page (already clamped to `1..pageCount`). */
  onPageChange: (page: number) => void;
  /** Pages to show on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the very start and very end. */
  boundaryCount?: number;
  /** Render the previous/next arrow controls. */
  showPrevNext?: boolean;
  /** Cell size. */
  size?: PaginationButtonVariantProps['size'];
  /** Accessible label for the `<nav>` landmark. */
  label?: string;
}

/**
 * Pagination — a controlled, accessible page navigator. Computes the visible page range (with
 * ellipses) from `page`/`pageCount`, fills the current page with the primary colour, and disables the
 * arrows at the boundaries. Renders nothing when there are no pages. Spec: docs/components/pagination.md.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    className,
    page,
    pageCount,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    showPrevNext = true,
    size = 'md',
    label = 'Pagination',
    ...props
  },
  ref,
) {
  const items = usePaginationRange({ page, pageCount, siblingCount, boundaryCount });

  if (pageCount <= 0) return null;

  const canPrev = page > 1;
  const canNext = page < pageCount;
  const go = (next: number): void => {
    const clamped = Math.min(Math.max(next, 1), pageCount);
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <nav ref={ref} aria-label={label} className={cn('flex items-center gap-1', className)} {...props}>
      {showPrevNext ? (
        <PaginationButton
          variant="nav"
          size={size}
          aria-label="Go to previous page"
          disabled={!canPrev}
          onClick={() => go(page - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </PaginationButton>
      ) : null}

      {items.map((item) =>
        typeof item === 'number' ? (
          <PaginationButton
            key={item}
            size={size}
            isActive={item === page}
            aria-label={`Go to page ${item}`}
            onClick={() => go(item)}
          >
            {item}
          </PaginationButton>
        ) : (
          <PaginationEllipsis key={item} size={size} />
        ),
      )}

      {showPrevNext ? (
        <PaginationButton
          variant="nav"
          size={size}
          aria-label="Go to next page"
          disabled={!canNext}
          onClick={() => go(page + 1)}
        >
          <ChevronRightIcon aria-hidden="true" />
        </PaginationButton>
      ) : null}
    </nav>
  );
});
