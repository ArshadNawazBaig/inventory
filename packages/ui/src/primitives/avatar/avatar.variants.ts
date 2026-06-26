import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Avatar root style API (cva). Holds the clipped image / fallback. Sizes set box + font; shape sets
 * the radius. Fallback surface is `bg-muted` / `text-muted-foreground`. Tokens only.
 * Spec: docs/components/avatar.md.
 */
export const avatarVariants = cva(
  [
    'relative flex shrink-0 select-none items-center justify-center overflow-hidden',
    'bg-muted font-medium text-muted-foreground',
  ],
  {
    variants: {
      size: {
        xs: 'size-6 text-[10px]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
        xl: 'size-16 text-lg',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  },
);

/** Status indicator dot, positioned bottom-right of the avatar with a ring to separate it. */
export const avatarStatusVariants = cva(
  ['absolute bottom-0 right-0 block rounded-full ring-2 ring-background'],
  {
    variants: {
      size: {
        xs: 'size-1.5',
        sm: 'size-2',
        md: 'size-2.5',
        lg: 'size-3',
        xl: 'size-3.5',
      },
      status: {
        online: 'bg-success',
        offline: 'bg-muted-foreground',
        away: 'bg-warning',
        busy: 'bg-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'offline',
    },
  },
);

export type AvatarVariantProps = VariantProps<typeof avatarVariants>;
