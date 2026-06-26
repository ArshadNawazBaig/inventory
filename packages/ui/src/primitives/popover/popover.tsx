'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../lib/cn';

/** Root — owns open state. `open`/`onOpenChange` (controlled) or `defaultOpen`. */
export const Popover = PopoverPrimitive.Root;
/** Opens the popover — use `asChild` to wrap a Button. */
export const PopoverTrigger = PopoverPrimitive.Trigger;
/** Anchor the panel to a different element than the trigger. */
export const PopoverAnchor = PopoverPrimitive.Anchor;
/** Closes the popover — use `asChild` to wrap a Button inside the content. */
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Render a small pointer arrow toward the trigger. */
  showArrow?: boolean;
}

/** The portalled, positioned panel (non-modal). Default width `w-72`; override via className. */
export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent(
  { className, align = 'center', sideOffset = 8, showArrow = false, children, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none',
          'max-h-[var(--radix-popover-content-available-height)]',
          className,
        )}
        {...props}
      >
        {children}
        {showArrow ? (
          <PopoverPrimitive.Arrow className="fill-popover" width={12} height={6} />
        ) : null}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
