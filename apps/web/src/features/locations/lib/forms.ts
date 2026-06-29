import { z } from 'zod';
import {
  LOCATION_TYPES,
  SITE_TYPES,
  type CreateLocationRequest,
  type CreateWarehouseRequest,
  type LocationResponse,
  type LocationType,
  type SiteType,
  type UpdateLocationRequest,
  type UpdateWarehouseRequest,
  type WarehouseResponse,
} from '@stockflow/types';
import { addressFormSchema, addressToForm, addressToInput, emptyAddressForm } from '@/lib/address-form';

/**
 * Form-shaped schemas + request mappers for Warehouses and Locations. As elsewhere, the wire contract
 * lives in `@stockflow/types`; these model human input (all-string fields, blank = unset) and translate to
 * the request shape. The API re-validates authoritatively.
 */

function trimmed(value: string): string {
  return value.trim();
}

const nameField = z.string().trim().min(1, 'Name is required').max(160, 'Name is too long');
const codePattern = /^[A-Za-z0-9][A-Za-z0-9_\-/]*$/;
const codeMessage = 'Letters, numbers, hyphen, underscore and slash only';
const optionalCode = z.string().trim().refine((v) => v === '' || codePattern.test(v), codeMessage);
const requiredCode = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(40, 'Code is too long')
  .regex(codePattern, codeMessage);
const optionalHexId = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[a-fA-F0-9]{24}$/.test(v), 'Must be a 24-character id');

/** Selectable location types with display labels (single source: `LOCATION_TYPES`). */
const TYPE_LABELS: Record<LocationType, string> = {
  zone: 'Zone',
  aisle: 'Aisle',
  shelf: 'Shelf',
  bin: 'Bin',
};
export const LOCATION_TYPE_OPTIONS = LOCATION_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }));

// ─── Warehouse / Store (a "site") ──────────────────────────────────────────────
/** Selectable site types with display labels (single source: `SITE_TYPES`). */
const SITE_TYPE_LABELS: Record<SiteType, string> = { warehouse: 'Warehouse', store: 'Store' };
export const SITE_TYPE_OPTIONS = SITE_TYPES.map((value) => ({ value, label: SITE_TYPE_LABELS[value] }));

export const warehouseFormSchema = z.object({
  name: nameField,
  type: z.enum(SITE_TYPES),
  code: optionalCode,
  isDefault: z.boolean(),
  address: addressFormSchema,
});
export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
export const emptyWarehouseForm: WarehouseFormValues = {
  name: '',
  type: 'warehouse',
  code: '',
  isDefault: false,
  address: { ...emptyAddressForm },
};

export function warehouseToForm(warehouse: WarehouseResponse): WarehouseFormValues {
  return {
    name: warehouse.name,
    type: warehouse.type,
    code: warehouse.code ?? '',
    isDefault: warehouse.isDefault,
    address: addressToForm(warehouse.address),
  };
}

export function toCreateWarehouse(values: WarehouseFormValues): CreateWarehouseRequest {
  const request: CreateWarehouseRequest = { name: trimmed(values.name), type: values.type };
  if (trimmed(values.code)) request.code = trimmed(values.code);
  if (values.isDefault) request.isDefault = true;
  const address = addressToInput(values.address);
  if (address) request.address = address;
  return request;
}

export function toUpdateWarehouse(values: WarehouseFormValues): UpdateWarehouseRequest {
  return {
    name: trimmed(values.name),
    type: values.type,
    code: trimmed(values.code) ? trimmed(values.code) : null,
    isDefault: values.isDefault,
    address: addressToInput(values.address) ?? null,
  };
}

// ─── Location ────────────────────────────────────────────────────────────────
export const locationFormSchema = z.object({
  name: nameField,
  code: requiredCode,
  type: z.enum(LOCATION_TYPES),
  parentLocationId: optionalHexId,
});
export type LocationFormValues = z.infer<typeof locationFormSchema>;
export const emptyLocationForm: LocationFormValues = {
  name: '',
  code: '',
  type: 'zone',
  parentLocationId: '',
};

export function locationToForm(location: LocationResponse): LocationFormValues {
  return {
    name: location.name,
    code: location.code,
    type: location.type,
    parentLocationId: location.parentLocationId ?? '',
  };
}

export function toCreateLocation(values: LocationFormValues, warehouseId: string): CreateLocationRequest {
  const request: CreateLocationRequest = {
    warehouseId,
    name: trimmed(values.name),
    code: trimmed(values.code),
    type: values.type,
  };
  if (trimmed(values.parentLocationId)) request.parentLocationId = trimmed(values.parentLocationId);
  return request;
}

export function toUpdateLocation(values: LocationFormValues): UpdateLocationRequest {
  return {
    name: trimmed(values.name),
    code: trimmed(values.code),
    type: values.type,
    parentLocationId: trimmed(values.parentLocationId) ? trimmed(values.parentLocationId) : null,
  };
}
