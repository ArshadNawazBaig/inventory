import { forwardRef, type ButtonHTMLAttributes, type ElementType, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2, type LucideIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { buttonVariants, type ButtonVariantProps } from './button.variants';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonVariantProps, 'fullWidth'> {
  /** Render styles onto the child element (Radix Slot) — e.g. an anchor for navigation. */
  asChild?: boolean;
  /** Icon component rendered before the label (decorative). */
  leadingIcon?: LucideIcon;
  /** Icon component rendered after the label (decorative). */
  trailingIcon?: LucideIcon;
  /** Show a spinner and block interaction; sets `aria-busy`. */
  loading?: boolean;
  /** Optional label shown/announced while loading (width is preserved). */
  loadingText?: string;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  children?: ReactNode;
}

/**
 * Button — the primary action control. Use `asChild` for navigation (renders an `<a>`).
 * Spec & a11y rules: docs/components/button.md.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    loading = false,
    loadingText,
    fullWidth = false,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'button';
  const iconClass = size === 'lg' || size === 'icon' ? 'size-5' : 'size-4';

  // asChild forwards onto a single child element (Slot contract) — pass children through as-is.
  const content = asChild ? (
    children
  ) : (
    <>
      {loading ? (
        <Loader2 className={cn(iconClass, 'animate-spin')} aria-hidden="true" />
      ) : (
        LeadingIcon && <LeadingIcon className={iconClass} aria-hidden="true" />
      )}
      {loading && loadingText ? loadingText : children}
      {!loading && TrailingIcon && <TrailingIcon className={iconClass} aria-hidden="true" />}
    </>
  );

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      type={asChild ? undefined : type}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...props}
    >
      {content}
    </Comp>
  );
});
