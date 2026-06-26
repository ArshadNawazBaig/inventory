import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Dialog content style API (cva). Centered, portalled surface; `size` sets the max-width. Caps height
 * and scrolls long bodies. Tokens only — scrim uses the `bg-overlay` token (see DialogOverlay).
 * Spec: docs/components/dialog.md.
 */
export const dialogContentVariants = cva(
  [
    'fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4',
    'max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-border bg-background p-6',
    'text-foreground shadow-lg focus:outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type DialogContentVariantProps = VariantProps<typeof dialogContentVariants>;
