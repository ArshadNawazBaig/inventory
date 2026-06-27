'use client';

import { FieldControl, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import { useActiveLocations } from '../queries';

const NONE = '__none__';

export interface LocationSelectProps {
  warehouseId: string;
  value: string;
  onChange: (value: string) => void;
  /** Exclude a location from the options (e.g. the one being edited — it can't be its own parent). */
  excludeId?: string | undefined;
  placeholder?: string;
}

/**
 * Parent-location picker, scoped to a single warehouse's **active** locations. Renders the materialized
 * `path` so the hierarchy is legible. Must be rendered inside a `<Field>`; bind with RHF's `Controller`.
 */
export function LocationSelect({ warehouseId, value, onChange, excludeId, placeholder }: LocationSelectProps) {
  const { data, isLoading } = useActiveLocations(warehouseId);
  const items = (data?.data ?? []).filter((location) => location.id !== excludeId);
  const resolvedPlaceholder = isLoading ? 'Loading…' : (placeholder ?? 'No parent (top level)');

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === NONE ? '' : next)}
      disabled={isLoading || !warehouseId}
    >
      <FieldControl>
        <SelectTrigger placeholder={resolvedPlaceholder} />
      </FieldControl>
      <SelectContent>
        <SelectItem value={NONE}>No parent (top level)</SelectItem>
        {items.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.path} — {location.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
