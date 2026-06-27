/**
 * Money in StockFlow is always stored as **integer minor units + currency** (never a float) — see
 * DATABASE/ARCHITECTURE. Forms, however, let people type a major-unit decimal ("12.50"). These helpers
 * convert at the form boundary, parsing manually (not via `* 100`) to avoid binary-float rounding.
 *
 * Assumption: a 2-decimal minor exponent (the dominant case). Zero/three-decimal currencies (JPY, BHD)
 * are a documented follow-up; the API remains the source of truth for the stored integer.
 */

/** Parse a major-unit decimal string into integer minor units. Returns null for empty/invalid input. */
export function parseMajorToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const [whole, fraction = ''] = trimmed.split('.');
  const fractionPadded = (fraction + '00').slice(0, 2);
  return Number(whole) * 100 + Number(fractionPadded);
}

/** Format integer minor units back to an editable major-unit string ("1234" → "12.34"). */
export function formatMinorToMajor(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const absolute = Math.abs(Math.trunc(minor));
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${whole}.${fraction}`;
}
