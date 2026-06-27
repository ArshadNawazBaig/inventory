import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { ActorContext } from '../auth/actor-context';
import { UnauthorizedError } from '../errors';
import type { ContextualRequest } from '../http/contextual-request';

/**
 * Injects the request's {@link ActorContext} (tenant + actor). Fails closed with 401
 * when no tenant is resolved — so until the auth module populates it, tenant-scoped
 * endpoints reject rather than leak. Never reads the tenant from the request body.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorContext => {
    const req = ctx.switchToHttp().getRequest<ContextualRequest>();
    if (req.organizationId === undefined) {
      throw new UnauthorizedError('Tenant context is not available.');
    }
    return { organizationId: req.organizationId, actorId: req.userId ?? null };
  },
);
