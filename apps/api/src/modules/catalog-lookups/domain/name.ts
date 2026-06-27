/** Display form — trimmed, as the user typed it (case preserved). */
export function normalizeName(value: string): string {
  return value.trim();
}

/** Uniqueness key for names — trimmed + lower-cased, so "Tools" and "tools" collide. */
export function nameKey(value: string): string {
  return value.trim().toLowerCase();
}

/** Uniqueness key for unit codes — trimmed + lower-cased ("KG" and "kg" collide). */
export function codeKey(value: string): string {
  return value.trim().toLowerCase();
}
