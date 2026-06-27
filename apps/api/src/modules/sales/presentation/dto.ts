import { createZodDto } from 'nestjs-zod';
import {
  CreateSalesOrderRequestSchema,
  FulfillSalesOrderRequestSchema,
  SalesOrderListQuerySchema,
  UpdateSalesOrderRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class SalesOrderListQueryDto extends createZodDto(SalesOrderListQuerySchema) {}
export class CreateSalesOrderDto extends createZodDto(CreateSalesOrderRequestSchema) {}
export class UpdateSalesOrderDto extends createZodDto(UpdateSalesOrderRequestSchema) {}
export class FulfillSalesOrderDto extends createZodDto(FulfillSalesOrderRequestSchema) {}
