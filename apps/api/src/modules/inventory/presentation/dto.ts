import { createZodDto } from 'nestjs-zod';
import {
  CreateAdjustmentRequestSchema,
  StockLevelListQuerySchema,
  StockMovementListQuerySchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class CreateAdjustmentDto extends createZodDto(CreateAdjustmentRequestSchema) {}
export class StockLevelListQueryDto extends createZodDto(StockLevelListQuerySchema) {}
export class StockMovementListQueryDto extends createZodDto(StockMovementListQuerySchema) {}
