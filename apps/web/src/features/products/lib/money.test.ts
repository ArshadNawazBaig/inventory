import { describe, it, expect } from 'vitest';
import { formatMinorToMajor, parseMajorToMinor } from './money';

describe('parseMajorToMinor', () => {
  it('parses whole numbers', () => {
    expect(parseMajorToMinor('12')).toBe(1200);
  });

  it('parses two decimal places', () => {
    expect(parseMajorToMinor('12.34')).toBe(1234);
  });

  it('pads a single decimal place', () => {
    expect(parseMajorToMinor('12.5')).toBe(1250);
  });

  it('avoids binary-float rounding (0.07 → 7, not 7.0000001)', () => {
    expect(parseMajorToMinor('0.07')).toBe(7);
  });

  it('trims surrounding whitespace', () => {
    expect(parseMajorToMinor('  9.99 ')).toBe(999);
  });

  it('returns null for empty input', () => {
    expect(parseMajorToMinor('')).toBeNull();
    expect(parseMajorToMinor('   ')).toBeNull();
  });

  it('rejects more than two decimals', () => {
    expect(parseMajorToMinor('1.234')).toBeNull();
  });

  it('rejects non-numeric and negative input', () => {
    expect(parseMajorToMinor('abc')).toBeNull();
    expect(parseMajorToMinor('-5')).toBeNull();
  });
});

describe('formatMinorToMajor', () => {
  it('formats minor units with two decimals', () => {
    expect(formatMinorToMajor(1234)).toBe('12.34');
  });

  it('pads the fraction', () => {
    expect(formatMinorToMajor(7)).toBe('0.07');
  });

  it('formats zero', () => {
    expect(formatMinorToMajor(0)).toBe('0.00');
  });

  it('round-trips with parseMajorToMinor', () => {
    expect(parseMajorToMinor(formatMinorToMajor(1599))).toBe(1599);
  });
});
