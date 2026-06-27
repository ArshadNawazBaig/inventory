'use client';

import type { BrandResponse } from '@stockflow/types';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { BRANDS } from '../descriptors';
import { BrandFormDialog } from './brand-form-dialog';

export function BrandAdmin() {
  return (
    <ResourceManager<BrandResponse>
      descriptor={BRANDS}
      subtitle="Identify the makers of your products."
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
