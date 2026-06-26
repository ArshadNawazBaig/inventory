import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import {
  skeletonVariants,
  type SkeletonAnimation,
  type SkeletonVariant,
} from './skeleton.variants';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape — `rounded` block, `circle` (avatars), or `text` (a line bar). */
  variant?: SkeletonVariant;
  /** Motion — `pulse` (default), `shimmer`, or `none`. */
  animation?: SkeletonAnimation;
}

/**
 * Skeleton — a decorative, content-shaped placeholder shown while data loads. Size/shape it with utility
 * classes. Decorative by default (`aria-hidden`); convey the loading state on the container. Spec:
 * docs/components/skeleton.md.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, variant = 'rounded', animation = 'pulse', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(skeletonVariants({ variant, animation }), className)}
      {...props}
    />
  );
});

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of text lines. */
  lines?: number;
  /** Motion applied to every line. */
  animation?: SkeletonAnimation;
  /** Width of the final (shortened) line. */
  lastLineWidth?: string;
}

/**
 * SkeletonText — a stack of text-line placeholders, with the last line shortened to mimic a paragraph.
 * Spec: docs/components/skeleton.md.
 */
export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(function SkeletonText(
  { className, lines = 3, animation = 'pulse', lastLineWidth = '60%', ...props },
  ref,
) {
  return (
    <div ref={ref} aria-hidden="true" className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: Math.max(1, lines) }, (_, i) => {
        const isLast = i === lines - 1 && lines > 1;
        return (
          <Skeleton
            key={i}
            variant="text"
            animation={animation}
            {...(isLast ? { style: { width: lastLineWidth } } : {})}
          />
        );
      })}
    </div>
  );
});
