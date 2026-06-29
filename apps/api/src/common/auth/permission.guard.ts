import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { ForbiddenError } from '../errors';
import type { ContextualRequest } from '../http/contextual-request';

/**
 * Global authorization guard — **deny-by-default** RBAC (authorization.md). Runs after the {@link AuthGuard},
 * which has stamped the actor's effective permissions on the request. A route declares what it needs with
 * `@RequirePermission(...)`; this checks the actor holds **all** of them, else 403. Public routes and
 * authenticated-only routes (no declared permission) pass through.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<ContextualRequest>();
    const granted = new Set(req.permissions ?? []);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenError();
    }
    return true;
  }
}
