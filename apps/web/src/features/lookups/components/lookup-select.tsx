'use client';

import { FieldControl, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import type { LookupDescriptor } from '../descriptors';
import type { LookupRecord } from '../types';
import { useActiveLookups } from '../queries';

const NONE = '__none__';

export interface LookupSelectProps<T extends LookupRecord> {
  descriptor: LookupDescriptor<T>;
  value: string;
  onChange: (value: string) => void;
  /** Add a "None" option that clears the value (for optional references). */
  includeNone?: boolean;
  placeholder?: string;
}

/**
 * A Select fed by a resource's **active** lookups — the real picker that replaces raw 24-char id inputs
 * (a product's unit/category/brand, a category's parent). Must be rendered inside a `<Field>`; it wraps
 * the trigger in `<FieldControl>` so the field's label/error/aria wiring attaches. Bind it with RHF's
 * `Controller` (Select is not a native input).
 */
export function LookupSelect<T extends LookupRecord>({
  descriptor,
  value,
  onChange,
  includeNone = false,
  placeholder,
}: LookupSelectProps<T>) {
  const { data, isLoading } = useActiveLookups(descriptor);
  const items = data?.data ?? [];
  const resolvedPlaceholder = isLoading
    ? 'Loading…'
    : (placeholder ?? `Select a ${descriptor.singular.toLowerCase()}`);

  return (
    <Select value={value} onValueChange={(next) => onChange(next === NONE ? '' : next)} disabled={isLoading}>
      <FieldControl>
        <SelectTrigger placeholder={resolvedPlaceholder} />
      </FieldControl>
      <SelectContent>
        {includeNone ? <SelectItem value={NONE}>None</SelectItem> : null}
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
