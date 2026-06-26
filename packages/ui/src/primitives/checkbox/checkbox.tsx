'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { checkboxVariants } from './checkbox.variants';

export type CheckboxSize = 'sm' | 'md';

export interface CheckboxProps
  extends Omit<ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'asChild'> {
  /** Box size (16px / 20px). */
  size?: CheckboxSize;
  /** Error state — applies error styling and sets `aria-invalid`. */
  invalid?: boolean;
}

/**
 * Checkbox — a bare tri-state control (checked | unchecked | indeterminate). The label sits beside
 * it via `Field`'s inline layout; `indeterminate` is a visual/aria state only and is never submitted.
 * Spec: docs/components/checkbox.md.
 */
export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  function Checkbox({ className, size = 'md', invalid, checked, 'aria-invalid': ariaInvalid, ...props }, ref) {
    const iconClass = size === 'sm' ? 'size-3' : 'size-3.5';
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        aria-invalid={invalid ? true : ariaInvalid}
        className={cn(checkboxVariants({ size, invalid: invalid ?? false }), className)}
        {...(checked !== undefined ? { checked } : {})}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          {checked === 'indeterminate' ? (
            <Minus className={iconClass} aria-hidden="true" />
          ) : (
            <Check className={iconClass} aria-hidden="true" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  },
);
