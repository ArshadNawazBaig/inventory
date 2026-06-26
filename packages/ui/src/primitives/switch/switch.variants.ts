import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Switch track style API (cva). The control is a Radix button with `data-state` checked | unchecked,
 * so the track colour is data-driven. Off = `bg-input`, on = `bg-primary`. Tokens only.
 * Spec: docs/components/switch.md.
 */
export const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-[state=unchecked]:bg-input data-[state=checked]:bg-primary',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-[18px] w-8',
        md: 'h-6 w-11',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

/**
 * Switch thumb style API (cva). Slides from start to end on toggle; travel = inner track width − thumb.
 * sm: track 32 − borders 4 − thumb 14 = 14px · md: track 44 − borders 4 − thumb 20 = 20px.
 */
export const switchThumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform',
    'data-[state=unchecked]:translate-x-0',
  ],
  {
    variants: {
      size: {
        sm: 'size-3.5 data-[state=checked]:translate-x-[14px]',
        md: 'size-5 data-[state=checked]:translate-x-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type SwitchVariantProps = VariantProps<typeof switchVariants>;
