import { describe, it, expect } from 'vitest';
import { adjustmentFormSchema, emptyAdjustmentForm, toCreateAdjustment } from './forms';
import { formatDelta, formatMoney, MOVEMENT_TYPE_LABELS } from './format';

const HEX24 = 'a'.repeat(24);
const base = { ...emptyAdjustmentForm, variantId: HEX24, locationId: HEX24 };

describe('adjustmentFormSchema', () => {
  it('requires a variant, location and a non-zero whole-number delta', () => {
    expect(adjustmentFormSchema.safeParse(emptyAdjustmentForm).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '0' }).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '1.5' }).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '10' }).success).toBe(true);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '-5' }).success).toBe(true);
  });

  it('validates an optional unit cost and currency', () => {
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '10', unitCost: 'nope' }).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '10', currency: 'US' }).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...base, delta: '10', unitCost: '12.50', currency: 'usd' }).success).toBe(
      true,
    );
  });
});

describe('toCreateAdjustment', () => {
  it('parses the delta and omits a blank note/cost', () => {
    const request = toCreateAdjustment({ ...base, delta: '7' });
    expect(request.delta).toBe(7);
    expect(request.note).toBeUndefined();
    expect(request.unitCostMinor).toBeUndefined();
  });

  it('attaches unit cost (minor units) + currency on a positive delta', () => {
    const request = toCreateAdjustment({ ...base, delta: '10', unitCost: '12.50', currency: 'usd', note: '  recv  ' });
    expect(request.unitCostMinor).toBe(1250);
    expect(request.currency).toBe('USD');
    expect(request.note).toBe('recv');
  });

  it('drops unit cost on a negative (outbound) delta', () => {
    const request = toCreateAdjustment({ ...base, delta: '-4', unitCost: '12.50', currency: 'USD' });
    expect(request.unitCostMinor).toBeUndefined();
    expect(request.currency).toBeUndefined();
  });
});

describe('format helpers', () => {
  it('signs deltas and formats money', () => {
    expect(formatDelta(5)).toBe('+5');
    expect(formatDelta(-3)).toBe('-3');
    expect(formatMoney(null, null)).toBe('—');
    expect(formatMoney(1250, 'USD')).toBe('12.50 USD');
    expect(MOVEMENT_TYPE_LABELS.adjustment).toBe('Adjustment');
  });
});
