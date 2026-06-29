import type { LocationResponse, WarehouseResponse } from '@stockflow/types';
import type { LocationEntity, WarehouseEntity } from '../domain/entities';

/** Domain → response mappers; no entity/Mongoose leakage to clients. The domain `Address` already matches
 * the response shape (all-nullable), so it passes through. */
export function toWarehouseResponse(entity: WarehouseEntity): WarehouseResponse {
  return {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    code: entity.code,
    address: entity.address,
    isDefault: entity.isDefault,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toLocationResponse(entity: LocationEntity): LocationResponse {
  return {
    id: entity.id,
    warehouseId: entity.warehouseId,
    parentLocationId: entity.parentLocationId,
    path: entity.path,
    name: entity.name,
    code: entity.code,
    type: entity.type,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
