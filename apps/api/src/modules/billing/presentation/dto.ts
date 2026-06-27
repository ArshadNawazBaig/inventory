import { createZodDto } from 'nestjs-zod';
import { ChangePlanRequestSchema } from '@stockflow/types';

/** NestJS DTO from the shared Zod contract — validated by the global ZodValidationPipe. */
export class ChangePlanDto extends createZodDto(ChangePlanRequestSchema) {}
