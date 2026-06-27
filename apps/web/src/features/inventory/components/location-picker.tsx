'use client';

import { useState } from 'react';
import { Field, FieldControl, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import { WAREHOUSES } from '@/features/locations/descriptors';
import { useActiveLocations } from '@/features/locations/queries';
import { useActiveResources } from '@/features/resources/queries';

export interface LocationPickerProps {
  value: string;
  onChange: (locationId: string) => void;
  error?: string | undefined;
  disabled?: boolean;
}

/**
 * Cascading Warehouse → Location selector for choosing a stock cell. Lists the warehouse's active
 * locations (showing the materialized `path`). Two labelled `Field`s for accessibility.
 */
export function LocationPicker({ value, onChange, error, disabled = false }: LocationPickerProps) {
  const [warehouseId, setWarehouseId] = useState('');
  const warehouses = useActiveResources(WAREHOUSES);
  const locations = useActiveLocations(warehouseId);

  const warehouseItems = warehouses.data?.data ?? [];
  const locationItems = locations.data?.data ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Warehouse">
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

      <Field label="Location" error={error}>
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
