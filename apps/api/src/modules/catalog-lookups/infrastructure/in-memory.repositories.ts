import { Injectable } from '@nestjs/common';
import { InMemoryResourceRepository } from '../../../common/resource';
import type { BrandEntity, CategoryEntity, UnitEntity } from '../domain/entities';

/**
 * In-memory lookup stores — the generic resource repository specialised per entity. Tenant- and
 * soft-delete-aware; name + code uniqueness (via `findLiveByField`) are case-insensitive. Mongoose
 * adapters implement the same port and drop in without touching the application layer.
 */
@Injectable()
export class InMemoryCategoryRepository extends InMemoryResourceRepository<CategoryEntity> {}

@Injectable()
export class InMemoryBrandRepository extends InMemoryResourceRepository<BrandEntity> {}

@Injectable()
export class InMemoryUnitRepository extends InMemoryResourceRepository<UnitEntity> {}
