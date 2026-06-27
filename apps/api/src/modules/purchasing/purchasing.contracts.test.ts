import { describe, expect, it } from 'vitest';
import {
  CreatePurchaseOrderRequestSchema,
  PurchaseOrderListQuerySchema,
  ReceivePurchaseOrderRequestSchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('CreatePurchaseOrderRequestSchema', () => {
  const valid = {
    supplierId: HEX24,
    warehouseId: HEX24,
    currency: 'USD',
    lines: [{ variantId: HEX24, orderedQty: 5, unitCostMinor: 100 }],
  };

  it('accepts a valid PO and rejects unknown fields', () => {
    expect(CreatePurchaseOrderRequestSchema.safeParse(valid).success).toBe(true);
    expect(CreatePurchaseOrderRequestSchema.safeParse({ ...valid, foo: 1 }).success).toBe(false);
  });

  it('requires at least one line and a positive quantity', () => {
    expect(CreatePurchaseOrderRequestSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
    expect(
      CreatePurchaseOrderRequestSchema.safeParse({ ...valid, lines: [{ variantId: HEX24, orderedQty: 0, unitCostMinor: 1 }] })
        .success,
    ).toBe(false);
  });

  it('validates currency and the optional expectedAt date', () => {
    expect(CreatePurchaseOrderRequestSchema.safeParse({ ...valid, currency: 'usd' }).success).toBe(false);
    expect(CreatePurchaseOrderRequestSchema.safeParse({ ...valid, expectedAt: '2026-07-01' }).success).toBe(true);
    expect(CreatePurchaseOrderRequestSchema.safeParse({ ...valid, expectedAt: 'July' }).success).toBe(false);
  });
});

describe('ReceivePurchaseOrderRequestSchema', () => {
  it('requires a location and at least one line with a positive quantity', () => {
    expect(
      ReceivePurchaseOrderRequestSchema.safeParse({ locationId: HEX24, lines: [{ lineId: 'l1', quantity: 3 }] }).success,
    ).toBe(true);
    expect(ReceivePurchaseOrderRequestSchema.safeParse({ locationId: HEX24, lines: [] }).success).toBe(false);
    expect(
      ReceivePurchaseOrderRequestSchema.safeParse({ locationId: HEX24, lines: [{ lineId: 'l1', quantity: 0 }] }).success,
    ).toBe(false);
  });
});

describe('PurchaseOrderListQuerySchema', () => {
  it('defaults to -createdAt and validates status', () => {
    const result = PurchaseOrderListQuerySchema.safeParse({ page: '2', status: 'received' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(2);
    }
    expect(PurchaseOrderListQuerySchema.safeParse({ status: 'shipped' }).success).toBe(false);
  });
});
