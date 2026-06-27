/**
 * SKU value-object helpers. The canonical SKU form is uppercased + trimmed; the Zod
 * contract normalizes on input, and this guarantees the same rule at the domain edge
 * (e.g. uniqueness comparisons) regardless of the call path.
 */
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,63}$/;

export function normalizeSku(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidSku(value: string): boolean {
  return SKU_PATTERN.test(normalizeSku(value));
}
