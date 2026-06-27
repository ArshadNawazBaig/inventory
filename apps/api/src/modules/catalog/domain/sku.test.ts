import { describe, expect, it } from 'vitest';
import { isValidSku, normalizeSku } from './sku';

describe('sku', () => {
  it('normalizes to trimmed uppercase', () => {
    expect(normalizeSku('  wid-1 ')).toBe('WID-1');
    expect(normalizeSku('abc_123')).toBe('ABC_123');
  });

  it('accepts valid SKUs', () => {
    expect(isValidSku('WID-1')).toBe(true);
    expect(isValidSku('a1')).toBe(true);
    expect(isValidSku('A_B-C')).toBe(true);
  });

  it('rejects invalid SKUs', () => {
    expect(isValidSku('')).toBe(false);
    expect(isValidSku('-leading')).toBe(false);
    expect(isValidSku('has space')).toBe(false);
    expect(isValidSku('bad/char')).toBe(false);
  });
});
