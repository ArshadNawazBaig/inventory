import { describe, it, expect } from 'vitest';
import type { OrderFormValues } from '@/features/orders/lib/order-form';
import { toCreateSalesOrder } from './forms';

const base: OrderFormValues = {
  partyId: 'a'.repeat(24),
  warehouseId: 'b'.repeat(24),
  currency: 'usd',
  expectedAt: '',
  note: '',
  lines: [{ variantId: 'c'.repeat(24), qty: '3', unitMajor: '20.00' }],
};

describe('toCreateSalesOrder', () => {
  it('maps party→customer, unit major→unitPriceMinor, and upper-cases currency', () => {
    const request = toCreateSalesOrder(base);
    expect(request.customerId).toBe('a'.repeat(24));
    expect(request.currency).toBe('USD');
    expect(request.lines[0]).toEqual({ variantId: 'c'.repeat(24), orderedQty: 3, unitPriceMinor: 2000 });
  });

  it('omits a blank note and ignores expectedAt (not part of an SO)', () => {
    const request = toCreateSalesOrder({ ...base, expectedAt: '2026-07-01', note: '' });
    expect(request.note).toBeUndefined();
    expect('expectedAt' in request).toBe(false);
  });
});
