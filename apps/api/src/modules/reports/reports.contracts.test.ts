import { describe, expect, it } from 'vitest';
import {
  InventoryValuationQuerySchema,
  InventoryValuationResponseSchema,
  LowStockListQuerySchema,
  LowStockResponseSchema,
} from '@stockflow/types';

const HEX24 = 'a'.repeat(24);

describe('InventoryValuationQuerySchema', () => {
  it('accepts an empty query and an optional warehouse, rejecting unknown fields', () => {
    expect(InventoryValuationQuerySchema.safeParse({}).success).toBe(true);
    expect(InventoryValuationQuerySchema.safeParse({ warehouseId: HEX24 }).success).toBe(true);
    expect(InventoryValuationQuerySchema.safeParse({ warehouseId: 'nope' }).success).toBe(false);
    expect(InventoryValuationQuerySchema.safeParse({ foo: 1 }).success).toBe(false);
  });
});

describe('LowStockListQuerySchema', () => {
  it('coerces + defaults pagination', () => {
    const result = LowStockListQuerySchema.safeParse({ page: '2' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });
});

describe('report response schemas', () => {
  it('validate a valuation + a low-stock payload', () => {
    expect(
      InventoryValuationResponseSchema.safeParse({
        totals: { totalUnits: 18, totalValueMinor: 2000, variantCount: 2, cellCount: 3 },
        byWarehouse: [{ warehouseId: HEX24, warehouseName: 'Main', units: 13, valueMinor: 1000 }],
        currency: 'USD',
      }).success,
    ).toBe(true);

    expect(
      LowStockResponseSchema.safeParse({
        data: [
          { variantId: HEX24, sku: 'SKU-1', productName: 'Widget', onHand: 0, reorderPoint: 5, reorderQty: 0, suggestedQty: 5 },
        ],
        meta: { page: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      }).success,
    ).toBe(true);
  });
});
