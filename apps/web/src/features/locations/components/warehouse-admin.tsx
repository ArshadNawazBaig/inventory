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
      subtitle="Physical sites that hold stock. Each can have its own location tree."
      columns={[
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
