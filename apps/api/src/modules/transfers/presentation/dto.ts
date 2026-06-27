import { createZodDto } from 'nestjs-zod';
import {
  CreateTransferRequestSchema,
  ReceiveTransferRequestSchema,
  TransferListQuerySchema,
  UpdateTransferRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class TransferListQueryDto extends createZodDto(TransferListQuerySchema) {}
export class CreateTransferDto extends createZodDto(CreateTransferRequestSchema) {}
export class UpdateTransferDto extends createZodDto(UpdateTransferRequestSchema) {}
export class ReceiveTransferDto extends createZodDto(ReceiveTransferRequestSchema) {}
