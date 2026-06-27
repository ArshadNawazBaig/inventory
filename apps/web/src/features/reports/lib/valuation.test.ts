import { describe, expect, it } from 'vitest';
import { toValuationChartData } from './valuation';

describe('toValuationChartData', () => {
  it('maps warehouses to chart data in major units', () => {
    expect(
      toValuationChartData([
        { warehouseId: 'x', warehouseName: 'Main', units: 13, valueMinor: 150000 },
        { warehouseId: 'y', warehouseName: 'East', units: 5, valueMinor: 100000 },
      ]),
    ).toEqual([
      { name: 'Main', value: 1500 },
      { name: 'East', value: 1000 },
    ]);
  });

  it('labels an unnamed warehouse as Unassigned', () => {
    expect(toValuationChartData([{ warehouseId: 'z', warehouseName: null, units: 1, valueMinor: 250 }])).toEqual([
      { name: 'Unassigned', value: 2.5 },
    ]);
  });
});
