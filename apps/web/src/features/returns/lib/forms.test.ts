import { describe, expect, it } from 'vitest';
import { toCreateReturn, type ReturnFormValues } from './forms';

const base: ReturnFormValues = {
  kind: 'customer',
  partyId: 'e'.repeat(24),
  locationId: 'a'.repeat(24),
  reason: '',
  note: '',
  lines: [{ variantId: 'c'.repeat(24), qty: '4' }],
};

describe('toCreateReturn', () => {
  it('maps the kind, party, location and parses line quantities', () => {
    const request = toCreateReturn(base);
    expect(request.kind).toBe('customer');
    expect(request.partyId).toBe('e'.repeat(24));
    expect(request.locationId).toBe('a'.repeat(24));
    expect(request.lines).toEqual([{ variantId: 'c'.repeat(24), quantity: 4 }]);
    expect(request.reason).toBeUndefined();
    expect(request.note).toBeUndefined();
  });

  it('includes trimmed reason and note only when present', () => {
    const request = toCreateReturn({ ...base, kind: 'supplier', reason: '  damaged  ', note: '  rma 12  ' });
    expect(request.kind).toBe('supplier');
    expect(request.reason).toBe('damaged');
    expect(request.note).toBe('rma 12');
  });
});
