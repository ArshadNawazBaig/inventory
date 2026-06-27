import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validates and parses a value against a Zod schema, then returns the typed result.
 * Use per route, e.g. `@Body(new ZodValidationPipe(CreateThingSchema))`. Schemas
 * live in `packages/types` (same contract client + server). Define them `.strict()`
 * to reject unknown fields and prevent mass assignment (validation.md).
 */
@Injectable()
export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): TOutput {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ValidationError(
        'Validation failed.',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
