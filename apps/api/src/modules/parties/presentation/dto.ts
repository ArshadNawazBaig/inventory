import { createZodDto } from 'nestjs-zod';
import {
  CreateCustomerRequestSchema,
  CreateSupplierRequestSchema,
  LookupListQuerySchema,
  UpdateCustomerRequestSchema,
  UpdateSupplierRequestSchema,
} from '@stockflow/types';

/** NestJS DTO classes from the shared Zod contracts — validated by the global ZodValidationPipe. */
export class PartyListQueryDto extends createZodDto(LookupListQuerySchema) {}

export class CreateSupplierDto extends createZodDto(CreateSupplierRequestSchema) {}
export class UpdateSupplierDto extends createZodDto(UpdateSupplierRequestSchema) {}

export class CreateCustomerDto extends createZodDto(CreateCustomerRequestSchema) {}
export class UpdateCustomerDto extends createZodDto(UpdateCustomerRequestSchema) {}
