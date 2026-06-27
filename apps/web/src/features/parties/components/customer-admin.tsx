'use client';

import type { CustomerResponse } from '@stockflow/types';
import { Badge } from '@stockflow/ui';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { CUSTOMERS } from '../descriptors';
import { CustomerFormDialog } from './customer-form-dialog';

export function CustomerAdmin() {
  return (
    <ResourceManager<CustomerResponse>
      descriptor={CUSTOMERS}
      subtitle="Buyers you sell to."
      columns={[
        {
          header: 'Type',
          cell: (customer) => (
            <Badge tone={customer.customerType === 'business' ? 'info' : 'neutral'} size="sm">
              {customer.customerType === 'business' ? 'Business' : 'Individual'}
            </Badge>
          ),
        },
        {
          header: 'Email',
          cell: (customer) => customer.email ?? <span className="text-muted-foreground">—</span>,
        },
      ]}
      renderFormDialog={(props) => <CustomerFormDialog {...props} />}
    />
  );
}
