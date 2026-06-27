'use client';

import type { CategoryResponse } from '@stockflow/types';
import { ResourceManager } from '@/features/resources/components/resource-manager';
import { CATEGORIES } from '../descriptors';
import { CategoryFormDialog } from './category-form-dialog';

export function CategoryAdmin() {
  return (
    <ResourceManager<CategoryResponse>
      descriptor={CATEGORIES}
      subtitle="Classify products into a browsable tree."
      columns={[
        {
          header: 'Parent',
          cell: (category) =>
            category.parentId ? (
              <span className="font-mono text-xs text-muted-foreground">{category.parentId}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      renderFormDialog={(props) => <CategoryFormDialog {...props} />}
    />
  );
}
