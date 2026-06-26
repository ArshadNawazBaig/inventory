import { cva, type VariantProps } from 'class-variance-authority';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressTone = 'primary' | 'success' | 'warning' | 'error';

/** Spinner dimensions (colour is `currentColor`, so it inherits its context). */
export const spinnerVariants = cva('shrink-0 animate-spin', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
    },
  },
  defaultVariants: { size: 'md' },
});

/** Progress track (the rail). */
export const progressTrackVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: { sm: 'h-1', md: 'h-2', lg: 'h-3' },
    },
    defaultVariants: { size: 'md' },
  },
);

/** Progress indicator (the filled bar) — tone sets the colour. */
export const progressBarVariants = cva('h-full rounded-full', {
  variants: {
    tone: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-destructive',
    },
  },
  defaultVariants: { tone: 'primary' },
});

export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;
export type ProgressTrackVariantProps = VariantProps<typeof progressTrackVariants>;
export type ProgressBarVariantProps = VariantProps<typeof progressBarVariants>;
