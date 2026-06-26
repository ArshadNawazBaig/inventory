'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { dialogContentVariants, type DialogContentVariantProps } from './dialog.variants';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Root — owns open state. `open`/`onOpenChange` (controlled) or `defaultOpen`. */
export const Dialog = DialogPrimitive.Root;
/** Opens the dialog — use `asChild` to wrap a Button. */
export const DialogTrigger = DialogPrimitive.Trigger;
/** Closes the dialog — use `asChild` to wrap a Button in the footer. */
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

/** The scrim behind the dialog (token-driven, dark in both themes). */
export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-overlay', className)}
      {...props}
    />
  );
});

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    DialogContentVariantProps {
  /** Render the ✕ close button (default true). */
  showClose?: boolean;
}

/** The portalled, centered surface. Always include a `DialogTitle` for accessibility. */
export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, size, showClose = true, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              'absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors',
              'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

/** Header block — stacks title + description. */
export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />;
}

/** Footer — actions, right-aligned on larger screens. */
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
