import type { WarehouseValuation } from '@stockflow/types';

export interface ValuationChartDatum {
  name: string;
  value: number;
}

/**
 * Shape the by-warehouse valuation for a bar chart: a display name + the value in **major units** (Recharts
 * needs a number, not formatted money). Pure, so it's unit-testable.
 */
export function toValuationChartData(byWarehouse: ReadonlyArray<WarehouseValuation>): ValuationChartDatum[] {
  return byWarehouse.map((w) => ({
    name: w.warehouseName ?? 'Unassigned',
    value: Math.round(w.valueMinor) / 100,
  }));
}
