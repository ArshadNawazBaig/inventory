import { createZodDto } from 'nestjs-zod';
import {
  CreateLocationRequestSchema,
  CreateWarehouseRequestSchema,
  LocationListQuerySchema,
  LookupListQuerySchema,
  UpdateLocationRequestSchema,
  UpdateWarehouseRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class WarehouseListQueryDto extends createZodDto(LookupListQuerySchema) {}
export class CreateWarehouseDto extends createZodDto(CreateWarehouseRequestSchema) {}
export class UpdateWarehouseDto extends createZodDto(UpdateWarehouseRequestSchema) {}

export class LocationListQueryDto extends createZodDto(LocationListQuerySchema) {}
export class CreateLocationDto extends createZodDto(CreateLocationRequestSchema) {}
export class UpdateLocationDto extends createZodDto(UpdateLocationRequestSchema) {}
