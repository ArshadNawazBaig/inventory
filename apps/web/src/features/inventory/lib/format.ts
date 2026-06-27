import type { StockMovementType } from '@stockflow/types';
import { formatMinorToMajor } from '@/lib/money';

/** Display labels for the ledger movement types. */
export const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  receipt: 'Receipt',
  shipment: 'Shipment',
  adjustment: 'Adjustment',
  transfer_out: 'Transfer out',
  transfer_in: 'Transfer in',
  count_adjustment: 'Count',
  return_in: 'Return in',
  return_out: 'Return out',
  scrap: 'Scrap',
};

/** A signed delta with an explicit leading sign for positives. */
export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

/** Money (minor units + currency) for display, or an em-dash when unset. */
export function formatMoney(minor: number | null, currency: string | null): string {
  if (minor === null) return '—';
  return currency ? `${formatMinorToMajor(minor)} ${currency}` : formatMinorToMajor(minor);
}
