# Authorization

> **Status:** 🟢 Implemented (global AuthGuard + PermissionGuard, deny-by-default — see [auth module](../../docs/modules/auth.md) · ADR-031) · **Owner:** Security Engineer · **Related:** [rbac](./rbac.md) · [permissions](./permissions.md) · [tenant-isolation](./tenant-isolation.md)
>
> _Implemented:_ the **PermissionGuard** enforces each route's `@RequirePermission(...)` against the actor's effective permissions (403 on miss); the **AuthGuard** derives the tenant server-side from the session (401 when absent). Object-level / warehouse-scope checks remain a follow-up.

## Purpose
Decide what an authenticated identity is allowed to do — enforced server-side, always.

## Principles
- **Deny by default.** Access requires an explicit permission.
- **Least privilege.** Grant the minimum needed.
- Authorization = **permission check + tenant check + (optional) scope check**.

## Enforcement
- A NestJS guard resolves the actor's permissions from their role(s) and checks the required
  permission for the route/use case.
- Tenant check ensures the target resource's `organizationId` matches the actor's org.
- Scope check (e.g., warehouse-scoped operators) restricts to permitted locations.
- The **UI mirrors** these checks for UX but is **never** the enforcement point.

## Rules
- Every mutating endpoint declares its required permission explicitly.
- Object-level checks: verify the specific record belongs to the tenant (and scope) before acting.
- Cross-tenant access → 404 (don't reveal existence). See [backend/error-handling](../backend/error-handling.md).
- Authorization decisions on security-relevant actions are audit-logged.

See [rbac](./rbac.md) for the role model and [permissions](./permissions.md) for the catalog.
