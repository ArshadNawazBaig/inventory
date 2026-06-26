import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Card root style API (cva). The root owns the surface (border/bg/shadow) + vertical rhythm
 * (`gap-6 py-6`); parts add horizontal padding (`px-6`). `bg-card` is the canonical surface — one step
 * lighter than the page background in dark mode. Tokens only.
 * Spec: docs/components/card.md.
 */
export const cardVariants = cva(
  ['flex flex-col gap-6 rounded-xl py-6 text-card-foreground'],
  {
    variants: {
      variant: {
        default: 'border border-border bg-card shadow-sm',
        elevated: 'border border-transparent bg-card shadow-md',
        ghost: 'bg-transparent',
      },
      interactive: {
        true: [
          'cursor-pointer transition-shadow hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  },
);

export type CardVariantProps = VariantProps<typeof cardVariants>;
