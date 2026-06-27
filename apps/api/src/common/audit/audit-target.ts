/**
 * Derive the audited `{ action, entityType, entityId }` from an HTTP mutation — a pure function (no framework
 * deps) so it is exhaustively unit-testable. `action` reads `entity.verb` (e.g. `purchase_order.received`,
 * `product.created`); the verb comes from a known sub-action segment or the HTTP method. Returns `null` for
 * paths that should not be audited (the audit + health endpoints) or unmappable methods.
 */

/** Resource path segment → canonical entity type (kept explicit so audit actions are stable + predictable). */
const RESOURCE_ENTITY: Record<string, string> = {
  products: 'product',
  variants: 'variant',
  categories: 'category',
  brands: 'brand',
  units: 'unit',
  suppliers: 'supplier',
  customers: 'customer',
  warehouses: 'warehouse',
  locations: 'location',
  inventory: 'inventory',
  'purchase-orders': 'purchase_order',
  'sales-orders': 'sales_order',
  transfers: 'transfer',
  returns: 'return',
};

/** Trailing sub-action segment → past-tense audit verb (state transitions read naturally in the trail). */
const ACTION_VERB: Record<string, string> = {
  submit: 'submitted',
  receive: 'received',
  cancel: 'cancelled',
  confirm: 'confirmed',
  fulfill: 'fulfilled',
  dispatch: 'dispatched',
  complete: 'completed',
  archive: 'archived',
  restore: 'restored',
  adjustments: 'adjusted',
};

/** Resources whose mutations are never audited (the audit trail itself + health). */
const SKIP_RESOURCES = new Set(['audit-logs', 'health']);

export interface AuditTarget {
  action: string;
  entityType: string;
  entityId: string | null;
}

function extractId(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.id === 'string') return record.id;
    const movement = record.movement;
    if (movement && typeof movement === 'object' && typeof (movement as Record<string, unknown>).id === 'string') {
      return (movement as Record<string, unknown>).id as string;
    }
  }
  return null;
}

export function deriveAuditTarget(
  method: string,
  path: string,
  params: Record<string, unknown> | undefined,
  body: unknown,
): AuditTarget | null {
  const segments = path
    .replace(/^\/api\/v\d+\//, '')
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) return null;

  const resource = segments[0]!;
  if (SKIP_RESOURCES.has(resource)) return null;

  const entityType = RESOURCE_ENTITY[resource] ?? resource.replace(/-/g, '_').replace(/s$/, '');
  const last = segments[segments.length - 1]!;

  let verb: string | undefined = ACTION_VERB[last];
  if (verb === undefined) {
    const m = method.toUpperCase();
    if (m === 'POST') verb = 'created';
    else if (m === 'PATCH' || m === 'PUT') verb = 'updated';
    else if (m === 'DELETE') verb = 'deleted';
  }
  if (verb === undefined) return null;

  const pathId = segments.length > 1 && segments[1] !== last ? segments[1]! : null;
  const paramId = typeof params?.id === 'string' ? params.id : null;
  const entityId = paramId ?? extractId(body) ?? pathId ?? null;

  return { action: `${entityType}.${verb}`, entityType, entityId };
}
