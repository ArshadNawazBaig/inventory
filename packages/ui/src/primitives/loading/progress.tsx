'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import {
  progressBarVariants,
  progressTrackVariants,
  type ProgressSize,
  type ProgressTone,
} from './loading.variants';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Current value (0..`max`). Omit for an indeterminate bar. */
  value?: number;
  /** Upper bound. */
  max?: number;
  /** Track height. */
  size?: ProgressSize;
  /** Bar colour. */
  tone?: ProgressTone;
  /** Accessible name. */
  label?: string;
}

/**
 * Progress — a linear progress bar. Pass `value` for a determinate bar (fills to `value/max`) or omit it
 * for an indeterminate sliding bar. Spec: docs/components/loading.md.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value, max = 100, size = 'md', tone = 'primary', label = 'Loading', ...props },
  ref,
) {
  const indeterminate = value === undefined;
  const clamped = indeterminate ? 0 : Math.min(max, Math.max(0, value));
  const pct = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      {...(indeterminate ? {} : { 'aria-valuenow': clamped })}
      className={cn(progressTrackVariants({ size }), className)}
      {...props}
    >
      <div
        className={cn(
          progressBarVariants({ tone }),
          indeterminate ? 'w-1/3 animate-progress-indeterminate' : 'transition-[width] duration-300',
        )}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
});
