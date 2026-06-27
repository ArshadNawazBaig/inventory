# Parties module (Suppliers · Customers)

Backend for the external business parties the operational modules transact with. Design spec:
[`docs/modules/parties.md`](../../../../../docs/modules/parties.md).

## Layering (Clean Architecture)

```
domain/          Address + Party/Supplier/Customer entities
application/     ports + tokens · party-fields (address + shared field helpers) · Supplier/CustomerService
infrastructure/  in-memory repositories · id/clock/event adapters
presentation/    DTOs (createZodDto) · mappers · 2 controllers
parties.module.ts   binds ports → adapters
```

Built on the shared **`common/resource`** base (`ResourceService<T>` / `ResourceRepository<T>` /
`InMemoryResourceRepository<T>`) — the same generic CRUD + soft-delete/restore the catalog lookups use.
Parties differ in two ways, both expressed through the base:
- **Names are not unique** — uniqueness is on the optional `code` (`assertFieldAvailable('code')`); the
  `assertRestorable` hook is overridden to re-check `code` (not name).
- **Richer fields** — contact details + an embedded `Address`, handled by `party-fields.ts` helpers shared
  by both services.

## What is wired today vs. deferred

| Concern | Today | Becomes |
|---------|-------|---------|
| Persistence | `InMemory*Repository` (singletons) | Mongoose adapters (DB module) — same ports |
| Tenant context | `DevAuthGuard` (header, non-prod; fails closed in prod) | Better Auth `AuthContext` |
| Permissions | `@RequirePermission(...)` metadata | enforced by RBAC `PermissionGuard` |
| Used-by guard on delete | not enforced (soft delete only) | usage port / events once PO/SO read-models exist |
| Reference export | none yet | `PartyQuery` (supplierExists/customerExists) for Purchasing/Sales |

## API

Base `/api/v1/{suppliers,customers}` (URI versioning). Each: `GET /` · `POST /` · `GET /:id` · `PATCH /:id`
· `DELETE /:id` · `POST /:id/archive` · `POST /:id/restore`. Permissions: `{type}.view` / `{type}.manage`.

## Tests

- `application/party.service.test.ts` — contact + address create, name-not-unique, code uniqueness, empty
  address → null, tenant isolation, archive/restore/soft-delete (restore re-checks code), customer type.
- `parties.contracts.test.ts` — Zod accept/reject (strict, email/URL/currency/code, customerType default,
  credit limit, address country).
