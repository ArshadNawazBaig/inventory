'use client';

import type { SupplierResponse } from '@stockflow/types';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { SUPPLIERS } from '../descriptors';
import { SupplierFormDialog } from './supplier-form-dialog';

export function SupplierAdmin() {
  return (
    <ResourceManager<SupplierResponse>
      descriptor={SUPPLIERS}
      subtitle="Vendors you purchase from."
      columns={[
        {
          header: 'Code',
          cell: (supplier) =>
            supplier.code ? (
              <span className="font-mono text-xs">{supplier.code}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          header: 'Email',
          cell: (supplier) => supplier.email ?? <span className="text-muted-foreground">—</span>,
        },
      ]}
      renderFormDialog={(props) => <SupplierFormDialog {...props} />}
    />
  );
}
