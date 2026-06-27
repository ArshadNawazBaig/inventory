'use client';

import type { BrandResponse } from '@stockflow/types';
import { BRANDS } from '../descriptors';
import { BrandFormDialog } from './brand-form-dialog';
import { LookupManager } from './lookup-manager';

export function BrandAdmin() {
  return (
    <LookupManager<BrandResponse>
      descriptor={BRANDS}
      columns={[
        {
          header: 'Website',
          cell: (brand) =>
            brand.website ? (
              <a
                href={brand.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {brand.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      renderFormDialog={(props) => <BrandFormDialog {...props} />}
    />
  );
}
