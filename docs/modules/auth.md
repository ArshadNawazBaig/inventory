# Auth — identity, sessions & RBAC

> **Status:** 🟢 Backend + frontend implemented (port-based; Better Auth is the documented production adapter).
> **Related:** [.claude/security/authentication](../../.claude/security/authentication.md) ·
> [authorization](../../.claude/security/authorization.md) · [permissions](../../.claude/security/permissions.md) ·
> [rbac](../../.claude/security/rbac.md) · [PERSISTENCE](../PERSISTENCE.md) · ADR-031

The auth module is the security backbone every other module sits on: it authenticates the request, derives the
tenant + actor **server-side**, and enforces **deny-by-default** RBAC. It replaces the temporary `DevAuthGuard`
shim.

## Model
- **Organization** — a tenant. Created by self-serve signup; its first member is the Owner.
- **User** — a global account, unique by normalized email; the password is stored only as a hash.
- **Membership** — links a user to an organization with one or more **roles** (the unit RBAC resolves from).
- **Session** — an opaque token in an httpOnly cookie; only its SHA-256 hash is stored, so a DB leak can't be
  replayed. Expiry is enforced on read (and pruned); Mongo has a TTL index as a backstop.
- **Invitation** — a single-use, expiring token that adds a new member (emailed in production; the accept link
  is surfaced in the UI until Resend is wired).

## Permissions & roles
The atomic **permission catalog** (`<resource>.<action>`) is aggregated in `packages/types/src/auth.ts` from
every module's own `*_PERMISSIONS` constant — one source of truth shared by API + UI. Seven **system roles**
bundle permissions (deny-by-default; effective permissions = the union of a member's roles):

| Role | Summary |
|------|---------|
| Organization Owner | Full control, including billing ownership |
| Admin | Everything except transferring billing ownership |
| Inventory Manager | Catalog, stock, locations, transfers |
| Purchasing Manager | Suppliers, POs, receiving, supplier returns |
| Sales / Fulfillment | Customers, sales orders, fulfillment, customer returns |
| Warehouse Staff | Stock adjustments, counts, transfers |
| Viewer / Auditor | Read-only across the product + report/audit export |

A separate platform **Super Admin** (operates the SaaS, not a tenant role) and **custom roles** are follow-ups.

## Enforcement
Two global guards (`apps/api/src/common/auth`): the **AuthGuard** reads the session cookie, resolves it to
`{ organizationId, userId, permissions }`, and stamps it on the request (or 401); the **PermissionGuard** then
checks the route's `@RequirePermission(...)` against those permissions (or 403). `@Public()` opts a route out
(register/login/accept-invite/logout, health). The UI mirrors permissions (nav filtering, gated buttons) but is
never the enforcement point.

## Endpoints
| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| POST | `/v1/auth/register` | public | Create org + Owner; open a session |
| POST | `/v1/auth/login` | public | Verify credentials; open a session |
| POST | `/v1/auth/accept-invite` | public | Create the invited user; join + open a session |
| POST | `/v1/auth/logout` | public | Revoke the session; clear the cookie |
| GET | `/v1/auth/me` | authenticated | The current principal (roles + permissions) |
| GET | `/v1/members` | `member.view` | Active members + pending invitations |
| POST | `/v1/members/invite` | `member.invite` | Create an invitation |
| PATCH | `/v1/members/:id/roles` | `member.update` | Replace a member's roles |
| DELETE | `/v1/members/:id` | `member.remove` | Remove a member, revoke their sessions |
| GET | `/v1/roles` | `role.view` | The system roles + their permission bundles |

## Invariants
- The tenant comes from the session, **never** from the client body/headers.
- Cross-tenant ids resolve to 404; the Owner role is never assignable via invite/role-change; the **last Owner**
  cannot be demoted or removed.
- Role changes and removals **revoke the affected user's sessions** so new permissions apply immediately.

## Persistence
Runs on the `PERSISTENCE_DRIVER` switch (ADR-030): in-memory by default, Mongoose under `mongo`
(`organizations`, `users` [unique email], `memberships`, `sessions` [TTL], `invitations`). Passwords use Node's
**scrypt**; tokens are 256-bit opaque values stored as SHA-256 hashes — both behind ports so **Better Auth**
can become the production adapter with no application changes.

## Follow-ups
Better Auth integration (email verification + password reset via Resend, OAuth/SSO, MFA); rate-limiting +
lockout on auth endpoints; custom roles + warehouse-scoped permissions; ownership transfer; org switching for
multi-org users; a same-origin web→API proxy for first-party cookies + SSR route protection.
