import { describe, it, expect } from 'vitest';
import type { LocationResponse, WarehouseResponse } from '@stockflow/types';
import {
  LOCATION_TYPE_OPTIONS,
  emptyLocationForm,
  emptyWarehouseForm,
  locationFormSchema,
  locationToForm,
  toCreateLocation,
  toCreateWarehouse,
  toUpdateLocation,
  toUpdateWarehouse,
  warehouseFormSchema,
  warehouseToForm,
} from './forms';

const HEX24 = 'a'.repeat(24);

describe('warehouseFormSchema', () => {
  it('accepts a minimal warehouse (name only) and rejects a bad code/country', () => {
    expect(warehouseFormSchema.safeParse(emptyWarehouseForm).success).toBe(false); // empty name
    expect(warehouseFormSchema.safeParse({ ...emptyWarehouseForm, name: 'Main' }).success).toBe(true);
    expect(warehouseFormSchema.safeParse({ ...emptyWarehouseForm, name: 'Main', code: 'bad code!' }).success).toBe(
      false,
    );
    expect(
      warehouseFormSchema.safeParse({
        ...emptyWarehouseForm,
        name: 'Main',
        address: { ...emptyWarehouseForm.address, country: 'USA' },
      }).success,
    ).toBe(false);
  });
});

describe('toCreateWarehouse', () => {
  it('trims, omits a blank code, includes isDefault only when set, builds address', () => {
    const request = toCreateWarehouse({
      ...emptyWarehouseForm,
      name: '  Main DC  ',
      code: 'wh-main',
      isDefault: true,
      address: { ...emptyWarehouseForm.address, city: 'Ogdenville', country: 'us' },
    });
    expect(request.name).toBe('Main DC');
    expect(request.code).toBe('wh-main');
    expect(request.isDefault).toBe(true);
    expect(request.address).toEqual({ city: 'Ogdenville', country: 'US' });
  });

  it('omits blank code/address and a falsy isDefault', () => {
    const request = toCreateWarehouse({ ...emptyWarehouseForm, name: 'Main' });
    expect(request.code).toBeUndefined();
    expect(request.address).toBeUndefined();
    expect(request.isDefault).toBeUndefined();
  });
});

describe('toUpdateWarehouse', () => {
  it('nulls a blank code and address and passes isDefault through', () => {
    const request = toUpdateWarehouse({ ...emptyWarehouseForm, name: 'Main' });
    expect(request.code).toBeNull();
    expect(request.address).toBeNull();
    expect(request.isDefault).toBe(false);
  });
});

describe('warehouseToForm', () => {
  it('maps null fields to empty strings and keeps isDefault', () => {
    const warehouse: WarehouseResponse = {
      id: '1',
      name: 'Main',
      type: 'store',
      code: null,
      address: null,
      isDefault: true,
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };
    const values = warehouseToForm(warehouse);
    expect(values.code).toBe('');
    expect(values.type).toBe('store');
    expect(values.isDefault).toBe(true);
    expect(values.address.city).toBe('');
  });
});

describe('location form mappers', () => {
  it('exposes all four selectable types', () => {
    expect(LOCATION_TYPE_OPTIONS.map((option) => option.value)).toEqual(['zone', 'aisle', 'shelf', 'bin']);
  });

  it('requires a code and a valid type', () => {
    expect(locationFormSchema.safeParse({ ...emptyLocationForm, name: 'Zone A' }).success).toBe(false); // no code
    expect(locationFormSchema.safeParse({ ...emptyLocationForm, name: 'Zone A', code: 'A' }).success).toBe(true);
    expect(
      locationFormSchema.safeParse({ ...emptyLocationForm, name: 'Zone A', code: 'A', type: 'room' }).success,
    ).toBe(false);
  });

  it('builds a create request scoped to the warehouse and omits a blank parent', () => {
    const request = toCreateLocation({ ...emptyLocationForm, name: '  Zone A ', code: ' A ', type: 'zone' }, HEX24);
    expect(request.warehouseId).toBe(HEX24);
    expect(request.name).toBe('Zone A');
    expect(request.code).toBe('A');
    expect(request.parentLocationId).toBeUndefined();
  });

  it('nulls a blank parent on update', () => {
    const request = toUpdateLocation({ ...emptyLocationForm, name: 'Zone A', code: 'A', type: 'aisle' });
    expect(request.parentLocationId).toBeNull();
    expect(request.type).toBe('aisle');
  });

  it('round-trips a response to form values', () => {
    const location: LocationResponse = {
      id: '1',
      warehouseId: HEX24,
      parentLocationId: HEX24,
      path: 'A/A1',
      name: 'Aisle 1',
      code: 'A1',
      type: 'aisle',
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };
    const values = locationToForm(location);
    expect(values.code).toBe('A1');
    expect(values.type).toBe('aisle');
    expect(values.parentLocationId).toBe(HEX24);
  });
});
