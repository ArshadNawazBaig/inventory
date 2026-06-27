import type { NotificationType } from '@stockflow/types';

/**
 * The write side of the notification system — a framework-agnostic port so producers (the cross-cutting
 * interceptor today; domain services / the worker later) can enqueue an in-app notification without importing
 * the Notifications module. The module binds {@link NOTIFIER} to its `NotificationService`. Each call targets
 * exactly one recipient; fan-out to many recipients is a loop over `notify` (role/member fan-out is a follow-up).
 */
export interface NotifyInput {
  organizationId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: string | null;
  link?: string | null;
}

export interface Notifier {
  notify(input: NotifyInput): Promise<void>;
}

/** DI token for the notifier (provided + exported by the Notifications module). */
export const NOTIFIER = Symbol('Notifier');
