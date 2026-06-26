import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Checkbox box style API (cva). The control is a Radix button with `data-state`
 * checked | unchecked | indeterminate, so checked/indeterminate fills are driven by data attributes.
 * No color variants — semantics come from state. Tokens only — no raw colors.
 * Spec: docs/components/checkbox.md.
 */
export const checkboxVariants = cva(
  [
    'peer inline-flex shrink-0 items-center justify-center border border-input bg-background text-current transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'size-4 rounded-[4px]',
        md: 'size-5 rounded-sm',
      },
      invalid: {
        true: 'border-destructive focus-visible:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  },
);

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;
