import { type CustomDecorator, SetMetadata } from '@nestjs/common';

/** Metadata key marking a route as not requiring authentication. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as public. The authentication guard (added with the auth module in
 * Phase 7) reads this metadata to skip the session check for that route.
 */
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);
