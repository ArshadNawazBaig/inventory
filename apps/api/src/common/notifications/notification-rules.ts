import type { NotificationType } from '@stockflow/types';
import { deriveAuditTarget } from '../audit/audit-target';

/**
 * Map a successful HTTP mutation to an in-app notification — a pure function (no framework deps) so it is
 * unit-testable. Unlike audit (which records *every* mutation), notifications are **curated**: only the
 * noteworthy state transitions in the rules table below produce a notification; everything else returns `null`.
 * Reuses {@link deriveAuditTarget} to resolve the `{ action, entityId }`, then renders copy + a deep link.
 */
export interface DerivedNotification {
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string | null;
  link: string | null;
}

interface NotificationRule {
  type: NotificationType;
  title: string;
  body: string;
  /** Builds the deep link to the entity detail page from its id (null when the id is unknown). */
  link: (id: string) => string;
}

/** The curated allow-list: `entity.verb` → notification copy. Anything not here is not notification-worthy. */
const RULES: Record<string, NotificationRule> = {
  'purchase_order.submitted': {
    type: 'purchase_order',
    title: 'Purchase order submitted',
    body: 'A purchase order was submitted to the supplier.',
    link: (id) => `/purchasing/${id}`,
  },
  'purchase_order.received': {
    type: 'purchase_order',
    title: 'Purchase order received',
    body: 'Stock was received against a purchase order.',
    link: (id) => `/purchasing/${id}`,
  },
  'sales_order.confirmed': {
    type: 'sales_order',
    title: 'Sales order confirmed',
    body: 'A sales order was confirmed.',
    link: (id) => `/sales/${id}`,
  },
  'sales_order.fulfilled': {
    type: 'sales_order',
    title: 'Sales order fulfilled',
    body: 'Stock was shipped to fulfil a sales order.',
    link: (id) => `/sales/${id}`,
  },
  'transfer.dispatched': {
    type: 'transfer',
    title: 'Transfer dispatched',
    body: 'Stock left the source location and is in transit.',
    link: (id) => `/transfers/${id}`,
  },
  'transfer.received': {
    type: 'transfer',
    title: 'Transfer received',
    body: 'Stock from a transfer arrived at its destination.',
    link: (id) => `/transfers/${id}`,
  },
  'return.completed': {
    type: 'return',
    title: 'Return completed',
    body: 'A return was processed through inventory.',
    link: (id) => `/returns/${id}`,
  },
};

export function deriveNotification(
  method: string,
  path: string,
  params: Record<string, unknown> | undefined,
  body: unknown,
): DerivedNotification | null {
  const target = deriveAuditTarget(method, path, params, body);
  if (target === null) return null;

  const rule = RULES[target.action];
  if (rule === undefined) return null;

  return {
    type: rule.type,
    title: rule.title,
    body: rule.body,
    entityType: target.entityType,
    entityId: target.entityId,
    link: target.entityId ? rule.link(target.entityId) : null,
  };
}
