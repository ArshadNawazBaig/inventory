import { describe, expect, it } from 'vitest';
import {
  CreateAdjustmentRequestSchema,
  StockLevelListQuerySchema,
  StockMovementListQuerySchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('CreateAdjustmentRequestSchema', () => {
  it('accepts a minimal adjustment (variant, location, delta)', () => {
    expect(CreateAdjustmentRequestSchema.safeParse({ variantId: HEX24, locationId: HEX24, delta: 5 }).success).toBe(
      true,
    );
  });

  it('requires 24-hex references and an integer delta', () => {
    expect(CreateAdjustmentRequestSchema.safeParse({ variantId: 'nope', locationId: HEX24, delta: 1 }).success).toBe(
      false,
    );
    expect(
      CreateAdjustmentRequestSchema.safeParse({ variantId: HEX24, locationId: HEX24, delta: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects unknown fields and a bad currency', () => {
    expect(
      CreateAdjustmentRequestSchema.safeParse({ variantId: HEX24, locationId: HEX24, delta: 1, organizationId: 'x' })
        .success,
    ).toBe(false);
    expect(
      CreateAdjustmentRequestSchema.safeParse({ variantId: HEX24, locationId: HEX24, delta: 1, currency: 'usd' })
        .success,
    ).toBe(false);
  });

  it('accepts an inbound delta with unit cost + opKey', () => {
    expect(
      CreateAdjustmentRequestSchema.safeParse({
        variantId: HEX24,
        locationId: HEX24,
        delta: 10,
        unitCostMinor: 1500,
        currency: 'USD',
        opKey: 'po-123-line-1',
      }).success,
    ).toBe(true);
  });
});

describe('inventory list queries', () => {
  it('default level sort is -updatedAt and coerces pagination', () => {
    const result = StockLevelListQuerySchema.safeParse({ page: '2', variantId: HEX24 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('-updatedAt');
      expect(result.data.page).toBe(2);
    }
  });

  it('default movement sort is -createdAt and validates type', () => {
    const ok = StockMovementListQuerySchema.safeParse({ type: 'adjustment' });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.sort).toBe('-createdAt');
    expect(StockMovementListQuerySchema.safeParse({ type: 'teleport' }).success).toBe(false);
  });
});
