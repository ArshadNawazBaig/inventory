'use client';

import type { CategoryResponse } from '@stockflow/types';
import { CATEGORIES } from '../descriptors';
import { CategoryFormDialog } from './category-form-dialog';
import { LookupManager } from './lookup-manager';

export function CategoryAdmin() {
  return (
    <LookupManager<CategoryResponse>
      descriptor={CATEGORIES}
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
