import { createZodDto } from 'nestjs-zod';
import {
  CreateBrandRequestSchema,
  CreateCategoryRequestSchema,
  CreateUnitRequestSchema,
  LookupListQuerySchema,
  UpdateBrandRequestSchema,
  UpdateCategoryRequestSchema,
  UpdateUnitRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class LookupListQueryDto extends createZodDto(LookupListQuerySchema) {}

export class CreateCategoryDto extends createZodDto(CreateCategoryRequestSchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategoryRequestSchema) {}

export class CreateBrandDto extends createZodDto(CreateBrandRequestSchema) {}
export class UpdateBrandDto extends createZodDto(UpdateBrandRequestSchema) {}

export class CreateUnitDto extends createZodDto(CreateUnitRequestSchema) {}
export class UpdateUnitDto extends createZodDto(UpdateUnitRequestSchema) {}
