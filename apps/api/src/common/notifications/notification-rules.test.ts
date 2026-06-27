import { describe, expect, it } from 'vitest';
import { deriveNotification } from './notification-rules';

const ID = 'a'.repeat(24);

describe('deriveNotification', () => {
  it('renders copy + deep link for a curated state transition', () => {
    expect(deriveNotification('POST', `/api/v1/purchase-orders/${ID}/receive`, { id: ID }, {})).toEqual({
      type: 'purchase_order',
      title: 'Purchase order received',
      body: 'Stock was received against a purchase order.',
      entityType: 'purchase_order',
      entityId: ID,
      link: `/purchasing/${ID}`,
    });
  });

  it('covers the order/transfer/return transitions with the right links', () => {
    expect(deriveNotification('POST', `/api/v1/sales-orders/${ID}/fulfill`, { id: ID }, {})).toMatchObject({
      type: 'sales_order',
      title: 'Sales order fulfilled',
      link: `/sales/${ID}`,
    });
    expect(deriveNotification('POST', `/api/v1/transfers/${ID}/dispatch`, { id: ID }, {})).toMatchObject({
      type: 'transfer',
      title: 'Transfer dispatched',
      link: `/transfers/${ID}`,
    });
    expect(deriveNotification('POST', `/api/v1/transfers/${ID}/receive`, { id: ID }, {})).toMatchObject({
      type: 'transfer',
      title: 'Transfer received',
      link: `/transfers/${ID}`,
    });
    expect(deriveNotification('POST', `/api/v1/returns/${ID}/complete`, { id: ID }, {})).toMatchObject({
      type: 'return',
      title: 'Return completed',
      link: `/returns/${ID}`,
    });
  });

  it('returns null for mutations that are not notification-worthy', () => {
    // Creates, edits, cancels and unrelated resources are audited but not notified.
    expect(deriveNotification('POST', '/api/v1/purchase-orders', {}, { id: ID })).toBeNull();
    expect(deriveNotification('PATCH', `/api/v1/purchase-orders/${ID}`, { id: ID }, {})).toBeNull();
    expect(deriveNotification('POST', `/api/v1/purchase-orders/${ID}/cancel`, { id: ID }, {})).toBeNull();
    expect(deriveNotification('POST', '/api/v1/products', {}, { id: ID })).toBeNull();
    expect(deriveNotification('POST', '/api/v1/inventory/adjustments', {}, { movement: { id: ID } })).toBeNull();
  });
});
