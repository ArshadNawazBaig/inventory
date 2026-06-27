import { describe, expect, it } from 'vitest';
import {
  CreateSalesOrderRequestSchema,
  FulfillSalesOrderRequestSchema,
  SalesOrderListQuerySchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('CreateSalesOrderRequestSchema', () => {
  const valid = {
    customerId: HEX24,
    warehouseId: HEX24,
    currency: 'USD',
    lines: [{ variantId: HEX24, orderedQty: 2, unitPriceMinor: 500 }],
  };

  it('accepts a valid SO and rejects unknown fields', () => {
    expect(CreateSalesOrderRequestSchema.safeParse(valid).success).toBe(true);
    expect(CreateSalesOrderRequestSchema.safeParse({ ...valid, foo: 1 }).success).toBe(false);
  });

  it('requires at least one line, a positive quantity and a valid currency', () => {
    expect(CreateSalesOrderRequestSchema.safeParse({ ...valid, lines: [] }).success).toBe(false);
    expect(
      CreateSalesOrderRequestSchema.safeParse({ ...valid, lines: [{ variantId: HEX24, orderedQty: 0, unitPriceMinor: 1 }] })
        .success,
    ).toBe(false);
    expect(CreateSalesOrderRequestSchema.safeParse({ ...valid, currency: 'us' }).success).toBe(false);
  });
});

describe('FulfillSalesOrderRequestSchema', () => {
  it('requires a location and at least one line with a positive quantity', () => {
    expect(
      FulfillSalesOrderRequestSchema.safeParse({ locationId: HEX24, lines: [{ lineId: 'l1', quantity: 2 }] }).success,
    ).toBe(true);
    expect(FulfillSalesOrderRequestSchema.safeParse({ locationId: HEX24, lines: [] }).success).toBe(false);
    expect(
      FulfillSalesOrderRequestSchema.safeParse({ locationId: HEX24, lines: [{ lineId: 'l1', quantity: -1 }] }).success,
    ).toBe(false);
  });
});

describe('SalesOrderListQuerySchema', () => {
  it('defaults to -createdAt and validates status', () => {
    const result = SalesOrderListQuerySchema.safeParse({ page: '3', status: 'fulfilled' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sort).toBe('-createdAt');
    expect(SalesOrderListQuerySchema.safeParse({ status: 'received' }).success).toBe(false);
  });
});
