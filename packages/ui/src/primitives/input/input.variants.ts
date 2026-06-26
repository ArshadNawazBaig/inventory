import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Input field container style API (cva). The container holds the adornments + the bare <input>;
 * the focus ring is shown on the container via `focus-within`. Tokens only — no raw colors.
 * Spec: docs/components/input.md.
 */
export const inputVariants = cva(
  [
    'flex items-center gap-2 rounded-md text-sm text-foreground transition-colors',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
    'focus-within:ring-offset-2 focus-within:ring-offset-background',
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
        true: 'border-destructive focus-within:ring-destructive',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      invalid: false,
      disabled: false,
    },
  },
);

export type InputVariantProps = VariantProps<typeof inputVariants>;
