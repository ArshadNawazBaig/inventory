'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/cn';

/** Wrap the app once for shared open/skip-delay coordination. Also bundled inside `Tooltip`. */
export const TooltipProvider = TooltipPrimitive.Provider;
/** Composable root (for advanced use). */
export const TooltipRoot = TooltipPrimitive.Root;
/** The element the tip describes — use `asChild` to wrap a focusable Button/link. */
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps
  extends ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Render a small pointer arrow toward the trigger. */
  showArrow?: boolean;
}

/** The portalled tip. Inverted for contrast (`bg-foreground` / `text-background`). */
export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(function TooltipContent({ className, sideOffset = 6, showArrow = true, children, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md',
          className,
        )}
        {...props}
      >
        {children}
        {showArrow ? (
          <TooltipPrimitive.Arrow className="fill-foreground" width={11} height={5} />
        ) : null}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

export interface TooltipProps {
  /** The hint shown on hover/focus. */
  content: ReactNode;
  /** The trigger — a single focusable element. */
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  /** Hover delay before showing (focus shows immediately). Default 200ms. */
  delayDuration?: number;
  /** Render a pointer arrow (default true). */
  showArrow?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tooltip — a brief hint on hover/focus. Convenience wrapper over the Radix parts (self-contained:
 * includes its own Provider). For shared delay coordination, also mount one `TooltipProvider` at the
 * app root. Spec: docs/components/tooltip.md.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align,
  sideOffset,
  delayDuration = 200,
  showArrow = true,
  open,
  defaultOpen,
  onOpenChange,
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot
        {...(open !== undefined ? { open } : {})}
        {...(defaultOpen !== undefined ? { defaultOpen } : {})}
        {...(onOpenChange ? { onOpenChange } : {})}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          showArrow={showArrow}
          {...(align ? { align } : {})}
          {...(sideOffset !== undefined ? { sideOffset } : {})}
        >
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
