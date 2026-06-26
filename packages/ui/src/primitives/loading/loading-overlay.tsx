'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './spinner';
import type { SpinnerSize } from './loading.variants';

export interface LoadingOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Render the overlay (renders nothing when false). */
  show?: boolean;
  /** Message shown under the spinner. */
  label?: ReactNode;
  /** Cover the viewport (`fixed`) instead of the nearest `relative` ancestor (`absolute`). */
  fullscreen?: boolean;
  /** Blur the content behind the overlay. */
  blur?: boolean;
  /** Spinner size. */
  spinnerSize?: SpinnerSize;
}

/**
 * LoadingOverlay — a dimmed cover that blocks a section (its nearest `relative` ancestor) or the viewport
 * (`fullscreen`) while work is in flight, with a centred spinner and optional message. Spec:
 * docs/components/loading.md.
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(function LoadingOverlay(
  { className, show = true, label, fullscreen = false, blur = false, spinnerSize = 'lg', ...props },
  ref,
) {
  if (!show) return null;
  return (
    <div
      ref={ref}
      role="status"
      aria-busy="true"
      aria-label={typeof label === 'string' ? label : label ? undefined : 'Loading'}
      className={cn(
        'z-50 flex flex-col items-center justify-center gap-3 bg-background/70',
        fullscreen ? 'fixed inset-0' : 'absolute inset-0',
        blur && 'backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <Spinner size={spinnerSize} aria-hidden="true" className="text-primary" />
      {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
    </div>
  );
});
