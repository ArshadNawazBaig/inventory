import { forwardRef, type HTMLAttributes } from 'react';
import { type LucideIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { badgeVariants } from './badge.variants';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeAppearance = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Intent colour. */
  tone?: BadgeTone;
  /** Fill style. */
  appearance?: BadgeAppearance;
  /** Size. */
  size?: BadgeSize;
  /** Leading status dot (inherits the tone colour via `currentColor`). */
  dot?: boolean;
  /** Decorative icon before the label. */
  leadingIcon?: LucideIcon;
  /** Decorative icon after the label. */
  trailingIcon?: LucideIcon;
}

/**
 * Badge — a non-interactive label for status, counts, and categories. Meaning lives in the text;
 * colour/dot are redundant cues. Spec: docs/components/badge.md.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    className,
    tone,
    appearance,
    size,
    dot = false,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    children,
    ...props
  },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ tone, appearance, size }), className)}
      {...props}
    >
      {dot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      ) : null}
      {LeadingIcon ? <LeadingIcon className="size-3 shrink-0" aria-hidden="true" /> : null}
      {children}
      {TrailingIcon ? <TrailingIcon className="size-3 shrink-0" aria-hidden="true" /> : null}
    </span>
  );
});
