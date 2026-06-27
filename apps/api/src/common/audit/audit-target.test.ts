import { describe, expect, it } from 'vitest';
import { deriveAuditTarget } from './audit-target';

const ID = 'a'.repeat(24);

describe('deriveAuditTarget', () => {
  it('maps a create POST to <entity>.created with the new id from the body', () => {
    expect(deriveAuditTarget('POST', '/api/v1/purchase-orders', {}, { id: ID })).toEqual({
      action: 'purchase_order.created',
      entityType: 'purchase_order',
      entityId: ID,
    });
  });

  it('maps a sub-action POST to its past-tense verb with the route id', () => {
    expect(deriveAuditTarget('POST', `/api/v1/purchase-orders/${ID}/receive`, { id: ID }, {})).toEqual({
      action: 'purchase_order.received',
      entityType: 'purchase_order',
      entityId: ID,
    });
    expect(deriveAuditTarget('POST', `/api/v1/transfers/${ID}/dispatch`, { id: ID }, {})).toMatchObject({
      action: 'transfer.dispatched',
    });
    expect(deriveAuditTarget('POST', `/api/v1/returns/${ID}/complete`, { id: ID }, {})).toMatchObject({
      action: 'return.completed',
    });
  });

  it('maps PATCH to updated and DELETE to deleted', () => {
    expect(deriveAuditTarget('PATCH', `/api/v1/products/${ID}`, { id: ID }, {})).toMatchObject({
      action: 'product.updated',
      entityId: ID,
    });
    expect(deriveAuditTarget('DELETE', `/api/v1/locations/${ID}`, { id: ID }, {})).toMatchObject({
      action: 'location.deleted',
    });
  });

  it('handles the inventory adjustments shape (no :id, movement id from the result)', () => {
    expect(deriveAuditTarget('POST', '/api/v1/inventory/adjustments', {}, { movement: { id: ID }, level: {} })).toEqual({
      action: 'inventory.adjusted',
      entityType: 'inventory',
      entityId: ID,
    });
  });

  it('archive/restore read as their own verbs', () => {
    expect(deriveAuditTarget('POST', `/api/v1/suppliers/${ID}/archive`, { id: ID }, {})).toMatchObject({
      action: 'supplier.archived',
    });
    expect(deriveAuditTarget('POST', `/api/v1/categories/${ID}/restore`, { id: ID }, {})).toMatchObject({
      action: 'category.restored',
    });
  });

  it('skips the audit + health resources and unmappable methods', () => {
    expect(deriveAuditTarget('GET', '/api/v1/audit-logs', {}, {})).toBeNull();
    expect(deriveAuditTarget('POST', '/api/v1/health', {}, {})).toBeNull();
    expect(deriveAuditTarget('OPTIONS', `/api/v1/products/${ID}`, { id: ID }, {})).toBeNull();
  });

  it('falls back to a derived entity type for unmapped resources', () => {
    expect(deriveAuditTarget('POST', '/api/v1/webhooks', {}, { id: ID })).toEqual({
      action: 'webhook.created',
      entityType: 'webhook',
      entityId: ID,
    });
  });
});
