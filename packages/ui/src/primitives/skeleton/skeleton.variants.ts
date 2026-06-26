import { cva, type VariantProps } from 'class-variance-authority';

export type SkeletonVariant = 'rounded' | 'circle' | 'text';
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'none';

/**
 * Skeleton placeholder — a neutral `muted` block; shape via `variant`, motion via `animation`. Size it with
 * utility classes. The `shimmer` sheen uses a token gradient on a `before` pseudo-element. Honours
 * reduced-motion via the base layer. Spec: docs/components/skeleton.md.
 */
export const skeletonVariants = cva('block bg-muted', {
  variants: {
    variant: {
      rounded: 'rounded-md',
      circle: 'rounded-full',
      text: 'h-4 w-full rounded',
    },
    animation: {
      pulse: 'animate-pulse',
      shimmer:
        'relative isolate overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent before:animate-skeleton-shimmer',
      none: '',
    },
  },
  defaultVariants: { variant: 'rounded', animation: 'pulse' },
});

export type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;
