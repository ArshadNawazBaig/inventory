'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/cn';
import { switchVariants, switchThumbVariants } from './switch.variants';

export type SwitchSize = 'sm' | 'md';

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, 'asChild'> {
  /** Track/thumb size. */
  size?: SwitchSize;
}

/**
 * Switch — a binary on/off control (`role="switch"`) for instant-effect settings. Not a styled
 * checkbox: use it when the change applies immediately. Label sits beside it via `Field`.
 * Spec: docs/components/switch.md.
 */
export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  function Switch({ className, size = 'md', ...props }, ref) {
    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(switchVariants({ size }), className)}
        {...props}
      >
        <SwitchPrimitive.Thumb className={cn(switchThumbVariants({ size }))} />
      </SwitchPrimitive.Root>
    );
  },
);
