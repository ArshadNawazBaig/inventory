'use client';

import { forwardRef, type ReactNode } from 'react';
import { XIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { filterChipClasses } from './filters.variants';

export interface FilterChipProps {
  /** Field name (muted). */
  label: ReactNode;
  /** Active value (emphasised). */
  value?: ReactNode;
  /** Make the body a button (e.g. to open an editor). */
  onClick?: () => void;
  /** Show a ✕ that calls this. */
  onRemove?: () => void;
  /** Accessible name for the ✕. */
  removeLabel?: string;
  className?: string;
}

/**
 * FilterChip — a removable filter pill (`label: value`). Used by `Filters`, and exported for bespoke filter
 * bars. Spec: docs/components/filters.md.
 */
export const FilterChip = forwardRef<HTMLDivElement, FilterChipProps>(function FilterChip(
  { label, value, onClick, onRemove, removeLabel = 'Remove filter', className },
  ref,
) {
  const content = (
    <>
      <span className="text-muted-foreground">
        {label}
        {value != null ? ':' : ''}
      </span>
      {value != null ? <span className="font-medium text-foreground">{value}</span> : null}
    </>
  );

  return (
    <div ref={ref} className={cn(filterChipClasses.wrapper, className)}>
      {onClick ? (
        <button type="button" onClick={onClick} className={filterChipClasses.body}>
          {content}
        </button>
      ) : (
        <span className={filterChipClasses.body}>{content}</span>
      )}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className={filterChipClasses.remove}
        >
          <XIcon className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});
