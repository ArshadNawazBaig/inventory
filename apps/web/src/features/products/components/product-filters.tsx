'use client';

import { Search, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import { PRODUCT_STATUS, type ProductStatus } from '@stockflow/types';

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
};

const ALL = 'all';

export interface ProductFiltersProps {
  q: string;
  status: ProductStatus | undefined;
  onSearch: (q: string) => void;
  onStatusChange: (status: ProductStatus | undefined) => void;
}

/** List controls — a debounced name/SKU/barcode search and a status filter. State lives in the URL. */
export function ProductFilters({ q, status, onSearch, onStatusChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="sm:max-w-xs sm:flex-1">
        <Search
          defaultValue={q}
          onSearch={onSearch}
          placeholder="Search name, SKU or barcode…"
          aria-label="Search products"
        />
      </div>
      <Select
        value={status ?? ALL}
        onValueChange={(value) => onStatusChange(value === ALL ? undefined : (value as ProductStatus))}
      >
        <SelectTrigger aria-label="Filter by status" className="sm:w-44" placeholder="Status" />
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {PRODUCT_STATUS.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABEL[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
