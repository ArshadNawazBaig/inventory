import { createZodDto } from 'nestjs-zod';
import { InventoryValuationQuerySchema, LowStockListQuerySchema } from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class InventoryValuationQueryDto extends createZodDto(InventoryValuationQuerySchema) {}
export class LowStockListQueryDto extends createZodDto(LowStockListQuerySchema) {}
