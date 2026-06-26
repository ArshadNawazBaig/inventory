'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import { spinnerVariants, type SpinnerSize } from './loading.variants';

export interface SpinnerProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'aria-label'> {
  /** Dimension. */
  size?: SpinnerSize;
  /** Accessible name (rendered as `aria-label` on the `role="status"` element). */
  label?: string;
}

/**
 * Spinner — a `currentColor` SVG busy indicator (inherits its context's text colour). Standalone it
 * announces via `role="status"`; pass `aria-hidden` to make it decorative inside an already-labelled
 * context. Spec: docs/components/loading.md.
 */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { className, size = 'md', label = 'Loading', ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
      />
    </svg>
  );
});
