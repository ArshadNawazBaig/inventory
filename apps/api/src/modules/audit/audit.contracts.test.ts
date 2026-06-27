import { describe, expect, it } from 'vitest';
import { AuditLogListQuerySchema, AuditLogResponseSchema } from '@stockflow/types';

describe('AuditLogListQuerySchema', () => {
  it('defaults to -createdAt and coerces pagination', () => {
    const result = AuditLogListQuerySchema.safeParse({ page: '2', entityType: 'purchase_order' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(2);
    }
  });

  it('accepts date or ISO bounds and rejects garbage + unknown fields', () => {
    expect(AuditLogListQuerySchema.safeParse({ from: '2026-02-01', to: '2026-02-28T23:59:59Z' }).success).toBe(true);
    expect(AuditLogListQuerySchema.safeParse({ from: 'last-tuesday' }).success).toBe(false);
    expect(AuditLogListQuerySchema.safeParse({ foo: 1 }).success).toBe(false);
  });
});

describe('AuditLogResponseSchema', () => {
  it('accepts a full entry with null diffs and metadata', () => {
    const ok = AuditLogResponseSchema.safeParse({
      id: 'a1',
      action: 'product.created',
      entityType: 'product',
      entityId: 'p-1',
      actorId: 'user-1',
      actorType: 'user',
      before: null,
      after: null,
      metadata: { ip: '127.0.0.1', userAgent: 'x', requestId: 'r1', method: 'POST', path: '/p', statusCode: 201 },
      createdAt: '2026-02-01T00:00:00.000Z',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects an unknown actor type', () => {
    const bad = AuditLogResponseSchema.safeParse({
      id: 'a1',
      action: 'x.created',
      entityType: 'x',
      entityId: null,
      actorId: null,
      actorType: 'robot',
      before: null,
      after: null,
      metadata: { ip: null, userAgent: null, requestId: null, method: null, path: null, statusCode: null },
      createdAt: '2026-02-01T00:00:00.000Z',
    });
    expect(bad.success).toBe(false);
  });
});
