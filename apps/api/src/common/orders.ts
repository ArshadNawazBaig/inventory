import type { OrderTotals } from '@stockflow/types';

/**
 * Shared order helpers (Purchasing + Sales). Totals are denormalized onto the order for list display;
 * tax is 0 until a tax engine lands (a documented follow-up). Money is integer minor units throughout.
 */
export function computeOrderTotals(lines: ReadonlyArray<{ quantity: number; unitMinor: number }>): OrderTotals {
  const subtotalMinor = lines.reduce((sum, line) => sum + line.quantity * line.unitMinor, 0);
  return { subtotalMinor, taxMinor: 0, totalMinor: subtotalMinor };
}
