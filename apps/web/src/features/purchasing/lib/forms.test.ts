import { describe, it, expect } from 'vitest';
import type { OrderFormValues } from '@/features/orders/lib/order-form';
import { toCreatePurchaseOrder } from './forms';

const base: OrderFormValues = {
  partyId: 'a'.repeat(24),
  warehouseId: 'b'.repeat(24),
  currency: 'usd',
  expectedAt: '',
  note: '',
  lines: [{ variantId: 'c'.repeat(24), qty: '10', unitMajor: '12.50' }],
};

describe('toCreatePurchaseOrder', () => {
  it('maps party→supplier, unit major→unitCostMinor, and upper-cases currency', () => {
    const request = toCreatePurchaseOrder(base);
    expect(request.supplierId).toBe('a'.repeat(24));
    expect(request.warehouseId).toBe('b'.repeat(24));
    expect(request.currency).toBe('USD');
    expect(request.lines[0]).toEqual({ variantId: 'c'.repeat(24), orderedQty: 10, unitCostMinor: 1250 });
  });

  it('omits a blank expectedAt and note but keeps provided ones', () => {
    expect(toCreatePurchaseOrder(base).expectedAt).toBeUndefined();
    expect(toCreatePurchaseOrder(base).note).toBeUndefined();
    const withExtras = toCreatePurchaseOrder({ ...base, expectedAt: '2026-07-01', note: '  rush  ' });
    expect(withExtras.expectedAt).toBe('2026-07-01');
    expect(withExtras.note).toBe('rush');
  });
});
