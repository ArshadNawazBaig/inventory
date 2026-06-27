import { createZodDto } from 'nestjs-zod';
import { UpdateOrganizationSettingsRequestSchema } from '@stockflow/types';

/** NestJS DTO from the shared Zod contract — validated by the global ZodValidationPipe. */
export class UpdateOrganizationSettingsDto extends createZodDto(UpdateOrganizationSettingsRequestSchema) {}
