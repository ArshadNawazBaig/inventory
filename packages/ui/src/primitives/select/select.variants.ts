import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Select trigger style API (cva). The trigger is a button (Radix), so the ring uses `focus-visible`.
 * Mirrors Input's variant/size tokens so a Select and an Input line up on a row. The placeholder is
 * styled via Radix's `data-placeholder` attribute. Tokens only — no raw colors.
 * Spec: docs/components/select.md.
 */
export const selectTriggerVariants = cva(
  [
    'flex w-full items-center justify-between gap-2 rounded-md text-sm text-foreground transition-colors',
    'data-[placeholder]:text-muted-foreground [&>span]:truncate',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border border-input bg-background',
        filled: 'border border-transparent bg-muted',
        ghost: 'border border-transparent bg-transparent',
      },
      inputSize: {
        sm: 'h-8 px-3',
        md: 'h-10 px-3',
        lg: 'h-11 px-4 text-base',
      },
      invalid: {
        true: 'border-destructive focus-visible:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      invalid: false,
    },
  },
);

export type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>;
