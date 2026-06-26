'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import {
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
  XIcon,
  type LucideIcon,
} from '@stockflow/icons';
import { cn } from '../../lib/cn';
import { toastVariants } from './toast.variants';
import type { ToastTone } from './toast.variants';
import { dismissToast, useToasts } from './toast-store';

/** Wraps the app; owns swipe direction, default duration, and the region label/hotkey. */
export const ToastProvider = ToastPrimitive.Provider;

const viewportPosition = {
  'top-left': 'top-0 left-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0 flex-col-reverse',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col-reverse',
  'bottom-right': 'bottom-0 right-0 flex-col-reverse',
} as const;

export type ToastPosition = keyof typeof viewportPosition;

export interface ToastViewportProps
  extends ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> {
  position?: ToastPosition;
}

/** The fixed `role="region"` container (F8 focus hotkey). Stacks toasts; capped width. */
export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ToastViewportProps
>(function ToastViewport({ className, position = 'bottom-right', ...props }, ref) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        'fixed z-[100] m-0 flex max-h-screen w-full list-none flex-col gap-2 p-4 sm:max-w-[400px] sm:p-6',
        viewportPosition[position],
        className,
      )}
      {...props}
    />
  );
});

export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Root>;

/** A single toast card (Radix Root) — neutral surface; compose a coloured icon for tone. */
export const Toast = forwardRef<ElementRef<typeof ToastPrimitive.Root>, ToastProps>(function Toast(
  { className, ...props },
  ref,
) {
  return <ToastPrimitive.Root ref={ref} className={cn(toastVariants(), className)} {...props} />;
});

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Title
      ref={ref}
      className={cn('text-sm font-medium leading-tight text-foreground', className)}
      {...props}
    />
  );
});

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn('mt-1 text-sm leading-snug text-muted-foreground', className)}
      {...props}
    />
  );
});

/** A toast action button (Radix requires `altText`). */
export const ToastAction = forwardRef<
  ElementRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(function ToastAction({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center self-center rounded-md border border-border bg-transparent px-2.5 text-xs font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  );
});

export const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      aria-label="Close"
      className={cn(
        'absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors',
        'hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      <XIcon className="size-3.5" aria-hidden="true" />
    </ToastPrimitive.Close>
  );
});

const toneIcon: Record<ToastTone, LucideIcon | null> = {
  default: null,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const toneIconColor: Record<ToastTone, string> = {
  default: '',
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

export interface ToasterProps {
  /** Where the stack sits. Default `bottom-right`. */
  position?: ToastPosition;
  /** Default auto-dismiss in ms (per-toast `duration` overrides). Default 5000. */
  duration?: number;
  /** Class overrides on the viewport. */
  className?: string;
}

/**
 * Toaster — mount once at the app root. Subscribes to the imperative `toast()` store and renders the queue
 * as token-skinned Radix toasts (auto-dismiss with pause-on-hover/blur, swipe-to-dismiss, F8 region focus).
 * Spec: docs/components/toast.md.
 */
export function Toaster({ position = 'bottom-right', duration = 5000, className }: ToasterProps) {
  const toasts = useToasts();
  return (
    <ToastProvider duration={duration} swipeDirection="right" label="Notifications ({hotkey})">
      {toasts.map((item) => {
        const Icon = toneIcon[item.tone];
        return (
          <Toast
            key={item.id}
            open={item.open}
            onOpenChange={(open) => {
              if (!open) dismissToast(item.id);
            }}
            {...(item.duration !== undefined ? { duration: item.duration } : {})}
          >
            {Icon ? (
              <Icon
                className={cn('mt-0.5 size-5 shrink-0', toneIconColor[item.tone])}
                aria-hidden="true"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              {item.title ? <ToastTitle>{item.title}</ToastTitle> : null}
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            {item.action ? (
              <ToastAction
                altText={item.action.altText ?? item.action.label}
                onClick={item.action.onClick}
              >
                {item.action.label}
              </ToastAction>
            ) : null}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport position={position} className={className} />
    </ToastProvider>
  );
}
