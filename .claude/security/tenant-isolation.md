# Tenant Isolation

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [database/multi-tenancy](../database/multi-tenancy.md) · [authorization](./authorization.md)

## Purpose
Guarantee one tenant can never access another's data. This is a top-priority security invariant.

## Defense in depth
1. **Auth context** sets `organizationId` from the session — never from client input.
2. **Data layer** auto-scopes every query/write by `organizationId` (base repository). See
   [database/multi-tenancy](../database/multi-tenancy.md).
3. **Authorization** verifies the target record's `organizationId` matches the actor's org.
4. **Responses** never include cross-tenant references; unknown/foreign ids → 404.

## Rules
- No endpoint accepts `organizationId` from the body/query to choose the tenant.
- Bulk operations, exports, search, and reports are all tenant-scoped — no global queries.
- Background jobs carry and enforce `organizationId`.
- File storage (Cloudinary) is foldered per org; signed URLs scoped appropriately. See [cloudinary](./cloudinary.md).

## Testing (mandatory, adversarial)
- For every endpoint: user in org A attempts to read/update/delete an org B resource by id →
  must fail (404/403) with no data leak.
- Fuzz ids; test pagination/filter/search/export paths; test job payload tampering.
- These tests are part of CI and the security checklist. See [checklists/security](../checklists/security.md).
