import { createZodDto } from 'nestjs-zod';
import { CreateSaleRequestSchema, SaleListQuerySchema } from '@stockflow/types';

/** NestJS DTOs from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class CreateSaleDto extends createZodDto(CreateSaleRequestSchema) {}
export class SaleListQueryDto extends createZodDto(SaleListQuerySchema) {}
