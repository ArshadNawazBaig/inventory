# RBAC

> **Status:** 🟢 Implemented (system roles + deny-by-default enforcement — see [auth module](../../docs/modules/auth.md) · ADR-031) · **Owner:** Security Engineer · **Related:** [permissions](./permissions.md) · [authorization](./authorization.md) · [PRD §5](../../docs/PRODUCT_REQUIREMENTS.md)
>
> _Implemented:_ the seven system roles below ship in `packages/types` (`SYSTEM_ROLES`), `Membership` carries a member's roles, and effective permissions are the union (deny-by-default). Custom roles, warehouse-scoping, ownership transfer and a platform Super Admin remain follow-ups.

## Purpose
Role-Based Access Control: bundle permissions into roles, assign roles to members.

## Model
- **Permission** — atomic capability ([permissions](./permissions.md)).
- **Role** — named bundle of permissions (system or custom), optionally warehouse-scoped.
- **Membership** — links a user to an organization with one or more roles.

## System roles (defaults)
| Role | Summary |
|------|---------|
| Organization Owner | Full control + billing ownership (transferable) |
| Admin | Manage users/roles/settings + all inventory ops |
| Inventory Manager | Full inventory ops (optionally warehouse-scoped) |
| Purchasing Manager | Suppliers, POs, receiving |
| Sales/Fulfillment | Sales orders, allocations, shipping |
| Warehouse Staff | Execute receive/pick/count/transfer (scoped) |
| Viewer/Auditor | Read-only across inventory, reports, audit |

## Custom roles
- Growth/Enterprise tiers can define custom roles from the permission catalog + scope.

## Rules
- Deny-by-default; effective permissions = union of assigned roles, intersected with scope.
- Role/permission changes take effect immediately and are audit-logged.
- Exactly one Owner per org (transfer is an explicit, audited action).
- Platform **Super Admin** is separate (operates the SaaS, not a tenant role).
