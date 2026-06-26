import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Textarea style API (cva). Unlike Input there are no adornments, so the variant classes and the
 * focus ring live directly on the <textarea> (focus-visible, not focus-within). Mirrors Input's
 * variant/size token system so the two controls read as the same family. Tokens only — no raw colors.
 * Spec: docs/components/textarea.md.
 */
export const textareaVariants = cva(
  [
    'block w-full rounded-md text-sm text-foreground transition-colors',
    'placeholder:text-muted-foreground',
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
        sm: 'min-h-16 px-3 py-2 text-sm',
        md: 'min-h-20 px-3 py-2 text-sm',
        lg: 'min-h-28 px-4 py-3 text-base',
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

export type TextareaVariantProps = VariantProps<typeof textareaVariants>;
