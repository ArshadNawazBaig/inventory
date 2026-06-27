'use client';

import type { UnitResponse } from '@stockflow/types';
import { UNITS } from '../descriptors';
import { LookupManager } from './lookup-manager';
import { UnitFormDialog } from './unit-form-dialog';

export function UnitAdmin() {
  return (
    <LookupManager<UnitResponse>
      descriptor={UNITS}
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
