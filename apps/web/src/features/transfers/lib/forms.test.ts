import { describe, expect, it } from 'vitest';
import { toCreateTransfer, type TransferFormValues } from './forms';

const base: TransferFormValues = {
  sourceLocationId: 'a'.repeat(24),
  destinationLocationId: 'b'.repeat(24),
  note: '',
  lines: [
    { variantId: 'c'.repeat(24), qty: '5' },
    { variantId: 'd'.repeat(24), qty: '2' },
  ],
};

describe('toCreateTransfer', () => {
  it('maps locations and parses line quantities to numbers', () => {
    const request = toCreateTransfer(base);
    expect(request.sourceLocationId).toBe('a'.repeat(24));
    expect(request.destinationLocationId).toBe('b'.repeat(24));
    expect(request.lines).toEqual([
      { variantId: 'c'.repeat(24), quantity: 5 },
      { variantId: 'd'.repeat(24), quantity: 2 },
    ]);
    expect(request.note).toBeUndefined();
  });

  it('includes a trimmed note only when present', () => {
    expect(toCreateTransfer({ ...base, note: '  rebalance stock  ' }).note).toBe('rebalance stock');
  });
});
