'use client';

import { useState } from 'react';
import { Field, FieldControl, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import { WAREHOUSES } from '@/features/locations/descriptors';
import { useActiveLocations } from '@/features/locations/queries';
import { useActiveResources } from '@/features/resources/queries';

export interface LocationPickerProps {
  value: string;
  onChange: (locationId: string) => void;
  /** Label for the location select (default `Location`); the warehouse select reads `<label> warehouse`. */
  label?: string;
  error?: string | undefined;
  disabled?: boolean;
}

/**
 * Cascading Warehouse → Location selector for choosing a stock cell. Lists the warehouse's active
 * locations (showing the materialized `path`). Two labelled `Field`s for accessibility. The optional `label`
 * distinguishes multiple pickers on one form (e.g. a transfer's source vs destination).
 */
export function LocationPicker({ value, onChange, label = 'Location', error, disabled = false }: LocationPickerProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const warehouses = useActiveResources(WAREHOUSES);
  const locations = useActiveLocations(warehouseId);

  const warehouseItems = warehouses.data?.data ?? [];
  const locationItems = locations.data?.data ?? [];
  const warehouseLabel = label === 'Location' ? 'Warehouse' : `${label} warehouse`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={warehouseLabel}>
        <Select
          value={warehouseId}
          onValueChange={(next) => {
            setWarehouseId(next);
            onChange(''); // reset the location when the warehouse changes
          }}
          disabled={disabled || warehouses.isLoading}
        >
          <FieldControl>
            <SelectTrigger placeholder={warehouses.isLoading ? 'Loading…' : 'Select a warehouse'} />
          </FieldControl>
          <SelectContent>
            {warehouseItems.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={label} error={error}>
        <Select value={value} onValueChange={onChange} disabled={disabled || !warehouseId || locations.isLoading}>
          <FieldControl>
            <SelectTrigger placeholder={warehouseId ? 'Select a location' : 'Pick a warehouse first'} />
          </FieldControl>
          <SelectContent>
            {locationItems.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.path} — {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
