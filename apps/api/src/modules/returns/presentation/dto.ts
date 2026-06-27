import { createZodDto } from 'nestjs-zod';
import {
  CreateReturnRequestSchema,
  ReturnListQuerySchema,
  UpdateReturnRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class ReturnListQueryDto extends createZodDto(ReturnListQuerySchema) {}
export class CreateReturnDto extends createZodDto(CreateReturnRequestSchema) {}
export class UpdateReturnDto extends createZodDto(UpdateReturnRequestSchema) {}
