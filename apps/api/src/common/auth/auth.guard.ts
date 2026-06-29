import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UnauthorizedError } from '../errors';
import type { ContextualRequest } from '../http/contextual-request';
import { SESSION_COOKIE_NAME, parseCookies } from './cookie';
import { SESSION_AUTHENTICATOR, type SessionAuthenticator } from './session-authenticator';

/**
 * Global authentication guard. Reads the httpOnly session cookie, resolves it server-side to the tenant +
 * actor + effective permissions, and stamps them on the request for downstream code (`@CurrentActor`, the
 * {@link PermissionGuard}, interceptors). Routes marked `@Public()` skip the check; everything else fails
 * closed with 401. The tenant is **never** read from the client — only from the session.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SESSION_AUTHENTICATOR) private readonly authenticator: SessionAuthenticator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<ContextualRequest>();
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
    if (!token) throw new UnauthorizedError();

    const resolved = await this.authenticator.authenticate(token);
    if (!resolved) throw new UnauthorizedError('Your session is invalid or has expired.');

    req.organizationId = resolved.organizationId;
    req.userId = resolved.userId;
    req.permissions = resolved.permissions;
    return true;
  }
}
