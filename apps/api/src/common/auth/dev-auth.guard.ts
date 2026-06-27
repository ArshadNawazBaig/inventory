import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { ContextualRequest } from '../http/contextual-request';

/**
 * TEMPORARY development tenant shim. Until the auth module (Better Auth + RBAC) lands,
 * this reads `x-organization-id` / `x-user-id` headers **in non-production only** so the
 * API is runnable locally. It enforces nothing and is replaced by the real AuthGuard.
 * In production it is a no-op, so tenant-scoped endpoints fail closed (401) until auth
 * is wired — never trust a client-supplied org in production (tenant-isolation.md).
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'production') {
      return true;
    }
    const req = context.switchToHttp().getRequest<ContextualRequest>();
    const org = req.headers['x-organization-id'];
    const user = req.headers['x-user-id'];
    if (typeof org === 'string' && org.length > 0) {
      req.organizationId = org;
    }
    if (typeof user === 'string' && user.length > 0) {
      req.userId = user;
    }
    return true;
  }
}
