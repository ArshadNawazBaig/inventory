'use client';

import { Badge } from '@stockflow/ui';
import type { WarehouseResponse } from '@stockflow/types';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { WAREHOUSES } from '../descriptors';
import { WarehouseFormDialog } from './warehouse-form-dialog';

export function WarehouseAdmin() {
  return (
    <ResourceManager<WarehouseResponse>
      descriptor={WAREHOUSES}
      subtitle="Warehouses (back-stock) and stores (retail) — each holds stock and can have its own location tree."
      columns={[
        {
          header: 'Type',
          cell: (warehouse) => (
            <Badge tone={warehouse.type === 'store' ? 'success' : 'neutral'} appearance="soft">
              {warehouse.type === 'store' ? 'Store' : 'Warehouse'}
            </Badge>
          ),
        },
        {
          header: 'Code',
          cell: (warehouse) =>
            warehouse.code ? (
              <span className="font-mono text-xs">{warehouse.code}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          header: 'Default',
          cell: (warehouse) =>
            warehouse.isDefault ? (
              <Badge tone="info" dot>
                Default
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      renderFormDialog={(props) => <WarehouseFormDialog {...props} />}
    />
  );
}
