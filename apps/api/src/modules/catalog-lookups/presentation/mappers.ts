import type { BrandResponse, CategoryResponse, UnitResponse } from '@stockflow/types';
import type { ResourceEntity } from '../../../common/resource';
import type { BrandEntity, CategoryEntity, UnitEntity } from '../domain/entities';

/** Shared envelope mapper (domain → response); no entity/Mongoose leakage to clients. */
function base(entity: ResourceEntity & { description: string | null }): Omit<CategoryResponse, 'parentId'> {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toCategoryResponse(entity: CategoryEntity): CategoryResponse {
  return { ...base(entity), parentId: entity.parentId };
}

export function toBrandResponse(entity: BrandEntity): BrandResponse {
  return { ...base(entity), website: entity.website };
}

export function toUnitResponse(entity: UnitEntity): UnitResponse {
  return { ...base(entity), code: entity.code };
}
