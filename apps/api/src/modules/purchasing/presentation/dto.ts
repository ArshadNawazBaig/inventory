import { createZodDto } from 'nestjs-zod';
import {
  CreatePurchaseOrderRequestSchema,
  PurchaseOrderListQuerySchema,
  ReceivePurchaseOrderRequestSchema,
  UpdatePurchaseOrderRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class PurchaseOrderListQueryDto extends createZodDto(PurchaseOrderListQuerySchema) {}
export class CreatePurchaseOrderDto extends createZodDto(CreatePurchaseOrderRequestSchema) {}
export class UpdatePurchaseOrderDto extends createZodDto(UpdatePurchaseOrderRequestSchema) {}
export class ReceivePurchaseOrderDto extends createZodDto(ReceivePurchaseOrderRequestSchema) {}
