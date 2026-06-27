'use client';

import type { UnitResponse } from '@stockflow/types';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { UNITS } from '../descriptors';
import { UnitFormDialog } from './unit-form-dialog';

export function UnitAdmin() {
  return (
    <ResourceManager<UnitResponse>
      descriptor={UNITS}
      subtitle="Units of measure for products and variants."
      columns={[
        {
          header: 'Code',
          cell: (unit) => <span className="font-mono text-xs">{unit.code}</span>,
        },
      ]}
      renderFormDialog={(props) => <UnitFormDialog {...props} />}
    />
  );
}
