import { createZodDto } from 'nestjs-zod';
import { AuditLogListQuerySchema } from '@stockflow/types';

/** NestJS DTO class from the shared Zod contract — validated by the global ZodValidationPipe. */
export class AuditLogListQueryDto extends createZodDto(AuditLogListQuerySchema) {}
