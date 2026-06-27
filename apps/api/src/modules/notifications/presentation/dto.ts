import { createZodDto } from 'nestjs-zod';
import { NotificationListQuerySchema } from '@stockflow/types';

/** NestJS DTO class from the shared Zod contract — validated by the global ZodValidationPipe. */
export class NotificationListQueryDto extends createZodDto(NotificationListQuerySchema) {}
