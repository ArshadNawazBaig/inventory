import { describe, expect, it } from 'vitest';
import { CreateSaleRequestSchema, SaleListQuerySchema } from '@stockflow/types';

const variantId = 'a'.repeat(24);
const locationId = 'b'.repeat(24);
const validLine = { variantId, quantity: 1, unitPriceMinor: 500 };

describe('CreateSaleRequestSchema', () => {
  it('accepts a valid walk-in sale', () => {
    const result = CreateSaleRequestSchema.safeParse({
      locationId,
      currency: 'USD',
      lines: [validLine],
      paymentMethod: 'cash',
      amountTenderedMinor: 500,
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one line and a known payment method', () => {
    expect(
      CreateSaleRequestSchema.safeParse({ locationId, currency: 'USD', lines: [], paymentMethod: 'cash', amountTenderedMinor: 0 }).success,
    ).toBe(false);
    expect(
      CreateSaleRequestSchema.safeParse({ locationId, currency: 'USD', lines: [validLine], paymentMethod: 'crypto', amountTenderedMinor: 500 }).success,
    ).toBe(false);
  });

  it('rejects a bad currency + unknown keys', () => {
    expect(
      CreateSaleRequestSchema.safeParse({ locationId, currency: 'usd', lines: [validLine], paymentMethod: 'cash', amountTenderedMinor: 500 }).success,
    ).toBe(false);
    expect(
      CreateSaleRequestSchema.safeParse({ locationId, currency: 'USD', lines: [validLine], paymentMethod: 'cash', amountTenderedMinor: 500, foo: 1 }).success,
    ).toBe(false);
  });
});

describe('SaleListQuerySchema', () => {
  it('defaults sort + pagination and coerces page', () => {
    const result = SaleListQuerySchema.safeParse({ page: '2' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-createdAt');
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });
});
