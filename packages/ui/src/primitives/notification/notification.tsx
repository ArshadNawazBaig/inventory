'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import {
  InfoIcon,
  SuccessIcon,
  WarningIcon,
  ErrorIcon,
  XIcon,
  type LucideIcon,
} from '@stockflow/icons';
import { cn } from '../../lib/cn';
import {
  notificationVariants,
  type NotificationAppearance,
  type NotificationTone,
} from './notification.variants';

export interface NotificationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Severity — drives the icon and colours. */
  tone?: NotificationTone;
  /** Surface treatment. */
  appearance?: NotificationAppearance;
  /** Heading line. */
  title?: ReactNode;
  /** Override the tone icon; `null` hides it. */
  icon?: LucideIcon | null;
  /** Buttons/links row rendered under the body. */
  action?: ReactNode;
  /** Show a ✕ that calls this; the caller owns visibility. */
  onDismiss?: () => void;
  /** Accessible name for the dismiss button. */
  dismissLabel?: string;
}

const toneIcon: Record<NotificationTone, LucideIcon | null> = {
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  neutral: null,
};

const toneIconColor: Record<NotificationTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  neutral: 'text-muted-foreground',
};

/**
 * Notification — an inline, persistent alert banner (tone × appearance) with an icon, title, body, optional
 * actions, and an optional dismiss. The in-page counterpart to the transient Toast. Spec:
 * docs/components/notification.md.
 */
export const Notification = forwardRef<HTMLDivElement, NotificationProps>(function Notification(
  {
    className,
    tone = 'info',
    appearance = 'soft',
    title,
    icon,
    action,
    onDismiss,
    dismissLabel = 'Dismiss',
    role,
    children,
    ...props
  },
  ref,
) {
  const Icon = icon === undefined ? toneIcon[tone] : icon;
  const isSolid = appearance === 'solid';
  const iconColor = isSolid ? 'text-current' : toneIconColor[tone];
  const bodyColor = isSolid ? 'text-current/90' : 'text-muted-foreground';
  const subtleColor = isSolid ? 'text-current/80 hover:text-current' : 'text-muted-foreground hover:text-foreground';
  const computedRole = role ?? (tone === 'error' || tone === 'warning' ? 'alert' : 'status');

  return (
    <div
      ref={ref}
      role={computedRole}
      className={cn(notificationVariants({ tone, appearance }), onDismiss && 'pr-10', className)}
      {...props}
    >
      {Icon ? <Icon className={cn('mt-0.5 size-5 shrink-0', iconColor)} aria-hidden="true" /> : null}

      <div className="min-w-0 flex-1">
        {title ? <div className="font-medium leading-tight">{title}</div> : null}
        {children ? (
          <div className={cn('leading-snug', title && 'mt-1', bodyColor)}>{children}</div>
        ) : null}
        {action ? <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className={cn(
            'absolute right-2 top-2 flex size-6 items-center justify-center rounded-md transition-colors',
            'hover:bg-black/5 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            subtleColor,
          )}
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});
