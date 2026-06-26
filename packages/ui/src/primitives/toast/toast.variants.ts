import { cva, type VariantProps } from 'class-variance-authority';

/** Semantic tone of a toast. Conveyed by a coloured leading icon (never colour alone). */
export type ToastTone = 'default' | 'success' | 'error' | 'warning' | 'info';

/**
 * Toast card (Radix Root). A clean, neutral `popover` surface with a soft border + shadow; the tone reads
 * from a coloured leading icon, not the surface, so text keeps AA contrast in both themes. Enter/exit +
 * swipe are driven off Radix `data-state`/`data-swipe` (keyframes in globals.css; honours reduced-motion
 * via the base layer). Spec: docs/components/toast.md.
 */
export const toastVariants = cva([
  'group pointer-events-auto relative flex w-full items-start gap-3 rounded-xl border border-border bg-popover py-3 pl-4 pr-10 text-popover-foreground shadow-lg',
  'data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out',
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
  'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
  'data-[swipe=end]:animate-toast-swipe-out',
]);

export type ToastVariantProps = VariantProps<typeof toastVariants>;
