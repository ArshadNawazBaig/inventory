import { describe, expect, it } from 'vitest';
import { NotificationListQuerySchema, NotificationResponseSchema } from '@stockflow/types';

describe('NotificationListQuerySchema', () => {
  it('defaults status to all + sort to -createdAt and coerces pagination', () => {
    const result = NotificationListQuerySchema.safeParse({ page: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('all');
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(3);
    }
  });

  it('validates status + type and rejects unknown fields', () => {
    expect(NotificationListQuerySchema.safeParse({ status: 'unread', type: 'transfer' }).success).toBe(true);
    expect(NotificationListQuerySchema.safeParse({ status: 'archived' }).success).toBe(false);
    expect(NotificationListQuerySchema.safeParse({ type: 'email' }).success).toBe(false);
    expect(NotificationListQuerySchema.safeParse({ foo: 1 }).success).toBe(false);
  });
});

describe('NotificationResponseSchema', () => {
  it('accepts a read + an unread entry', () => {
    const base = {
      id: 'n1',
      type: 'purchase_order',
      title: 'Purchase order received',
      body: 'Stock was received.',
      entityType: 'purchase_order',
      entityId: 'po-1',
      link: '/purchasing/po-1',
      createdAt: '2026-03-01T00:00:00.000Z',
    };
    expect(NotificationResponseSchema.safeParse({ ...base, readAt: null }).success).toBe(true);
    expect(NotificationResponseSchema.safeParse({ ...base, readAt: '2026-03-02T00:00:00.000Z' }).success).toBe(true);
  });
});
