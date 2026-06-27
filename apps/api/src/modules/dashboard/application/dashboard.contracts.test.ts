import { describe, it, expect } from 'vitest';
import {
  DASHBOARD_PERMISSIONS,
  DashboardSummaryResponseSchema,
  StatusCountSchema,
  type DashboardSummaryResponse,
} from '@stockflow/types';

const valid: DashboardSummaryResponse = {
  inventory: { totalValueMinor: 13400, totalUnits: 64, variantCount: 3, currency: 'USD' },
  counts: { lowStock: 7, openPurchaseOrders: 4, openSalesOrders: 4, inTransitTransfers: 3 },
  valuationByWarehouse: [{ warehouseId: 'wh', warehouseName: 'Main', units: 54, valueMinor: 10400 }],
  ordersByStatus: {
    purchaseOrders: [{ status: 'draft', count: 2 }],
    salesOrders: [{ status: 'confirmed', count: 1 }],
    transfers: [{ status: 'in_transit', count: 2 }],
  },
  topLowStock: [
    { variantId: 'v', sku: 'A1', productName: 'Widget', onHand: 0, reorderPoint: 8, reorderQty: 8, suggestedQty: 8 },
  ],
  recentMovements: [
    {
      id: 'm1', type: 'receipt', reasonKind: 'purchase_order', delta: 10,
      variantId: 'v', sku: 'A1', productName: 'Widget', locationId: 'l', locationName: 'Aisle 1',
      createdAt: '2026-06-27T10:00:00.000Z',
    },
  ],
};

describe('Dashboard contracts', () => {
  it('exposes the view permission key', () => {
    expect(DASHBOARD_PERMISSIONS.view).toBe('dashboard.view');
  });

  it('accepts a well-formed summary payload', () => {
    expect(DashboardSummaryResponseSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a payload with a missing block', () => {
    const { counts: _omit, ...rest } = valid;
    expect(DashboardSummaryResponseSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an unknown movement type', () => {
    const bad = { ...valid, recentMovements: [{ ...valid.recentMovements[0], type: 'teleport' }] };
    expect(DashboardSummaryResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('requires an integer status count', () => {
    expect(StatusCountSchema.safeParse({ status: 'draft', count: 1.5 }).success).toBe(false);
  });
});
