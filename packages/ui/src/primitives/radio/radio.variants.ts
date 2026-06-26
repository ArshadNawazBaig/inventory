import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Radio item style API (cva). The item is a Radix button (role=radio) marked `group`, containing the
 * dot + label. Selection styling keys off the item's `data-state`. `standard` is a dot + label row;
 * `card` is a selectable card with a border/ring on the selected one. Tokens only.
 * Spec: docs/components/radio.md.
 */
export const radioItemVariants = cva(
  [
    'group inline-flex rounded-md text-left text-sm text-foreground transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      appearance: {
        standard: 'items-center gap-2',
        card: [
          'items-start gap-3 rounded-lg border border-input p-3',
          'data-[state=unchecked]:hover:border-ring/40',
          'data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:ring-1 data-[state=checked]:ring-ring',
        ],
      },
      invalid: { true: '', false: '' },
    },
    compoundVariants: [
      {
        appearance: 'card',
        invalid: true,
        class: 'border-destructive data-[state=checked]:border-destructive data-[state=checked]:ring-destructive',
      },
    ],
    defaultVariants: { appearance: 'standard', invalid: false },
  },
);

/** The dot box (a span beside/above the label). Inner filled dot is rendered by the Radix Indicator. */
export const radioDotVariants = cva(
  [
    'flex shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors',
    'group-data-[state=checked]:border-primary',
  ],
  {
    variants: {
      size: { sm: 'size-4', md: 'size-5' },
      invalid: {
        true: 'border-destructive group-data-[state=checked]:border-destructive',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);

export type RadioItemVariantProps = VariantProps<typeof radioItemVariants>;
