/** Display form — trimmed, as the user typed it (case preserved). */
export function normalizeName(value: string): string {
  return value.trim();
}

/** Uniqueness key for names/codes — trimmed + lower-cased, so "Tools"/"tools" and "KG"/"kg" collide. */
export function nameKey(value: string): string {
  return value.trim().toLowerCase();
}
