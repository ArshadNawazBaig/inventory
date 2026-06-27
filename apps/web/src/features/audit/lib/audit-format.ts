import type { AuditActorType } from '@stockflow/types';

/** Human-friendly helpers for the audit viewer. Pure (no React) so they're trivially unit-testable. */

/** `purchase_order` → `Purchase order`. */
export function humanizeEntityType(entityType: string): string {
  const spaced = entityType.replace(/_/g, ' ').trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : entityType;
}

/** `purchase_order.received` → `Purchase order received`; degrades gracefully for odd shapes. */
export function humanizeAction(action: string): string {
  const dot = action.indexOf('.');
  if (dot === -1) return humanizeEntityType(action);
  const entityType = action.slice(0, dot);
  const verb = action.slice(dot + 1).replace(/_/g, ' ');
  return `${humanizeEntityType(entityType)} ${verb}`.trim();
}

/** `api_key` → `API key`. */
export function formatActorType(actorType: AuditActorType): string {
  switch (actorType) {
    case 'user':
      return 'User';
    case 'system':
      return 'System';
    case 'api_key':
      return 'API key';
    default:
      return actorType;
  }
}
