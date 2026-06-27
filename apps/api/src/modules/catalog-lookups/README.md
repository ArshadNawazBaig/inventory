# Catalog Lookups module (Categories · Brands · Units)

Backend for the three sibling reference lookups the Product module points at. Design spec:
[`docs/modules/catalog-lookups.md`](../../../../../docs/modules/catalog-lookups.md).

## Layering (Clean Architecture — dependencies point inward)

```
domain/          LookupEntity + Category/Brand/Unit entities · lookup.errors · name normalization
application/     LookupRepository<T> ports + tokens · LookupService<T> base + 3 concrete services
                 CatalogLookupQuery (exported public read surface)
infrastructure/  InMemoryLookupRepository<T> base + 3 repos · id/clock/event adapters
presentation/    DTOs (createZodDto) · mappers · 3 controllers
catalog-lookups.module.ts   binds ports → adapters; EXPORTS CatalogLookupQuery
```

`LookupService<T>` owns the shared invariants (name uniqueness, status transitions, soft-delete/restore);
`CategoryService`/`BrandService`/`UnitService` add the type-specific rules (category parent + cycle check,
unit code uniqueness). Services depend only on **ports** — never Mongoose or another module's repository.

## Cross-module seam (replaces `StubCatalogReference`)

The module **exports `CatalogLookupQuery`** (`categoryExists`/`brandExists`/`unitExists`). The Catalog
(Product) module imports it and binds its `CATALOG_REFERENCE` port to `LookupCatalogReference`, so a
product's category/brand/unit must now exist (live, same tenant). In-memory repos are Nest singletons, so
the reference adapter reads what the lookup controllers write. Dependency direction: catalog → lookups.

## What is wired today vs. deferred

| Concern | Today | Becomes |
|---------|-------|---------|
| Persistence | `InMemory*Repository` (singletons) | Mongoose adapters (DB module) — same ports |
| Tenant context | `DevAuthGuard` (header, non-prod; fails closed in prod) | Better Auth `AuthContext` |
| Permissions | `@RequirePermission(...)` metadata (declared) | enforced by RBAC `PermissionGuard` |
| Delete-in-use guard | not enforced (soft delete only) | usage port / event cleanup once a read-model exists |
| Slug + full category tree | name only; single `parentId` | slug + tree endpoints |

## API

Base `/api/v1/{categories,brands,units}` (URI versioning). Each resource: `GET /` · `POST /` · `GET /:id`
· `PATCH /:id` · `DELETE /:id` · `POST /:id/archive` · `POST /:id/restore`. Permissions: `{type}.view` /
`{type}.manage`. See [`docs/modules/catalog-lookups.md §5`](../../../../../docs/modules/catalog-lookups.md).

## Tests

- `application/lookup.service.test.ts` — base CRUD, name uniqueness, tenant isolation, category
  parent/cycle, unit code uniqueness, archive/restore/soft-delete, list filter/sort.
- `catalog-lookups.contracts.test.ts` — Zod accept/reject (strict, parent hex, unit code, brand URL,
  list coercion/limits).
