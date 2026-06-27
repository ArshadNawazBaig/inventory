# Catalog module (Product)

Backend implementation of the Product module. Design spec: [`docs/modules/product.md`](../../../../../docs/modules/product.md).

## Layering (Clean Architecture — dependencies point inward)

```
domain/          entities · Sku value object · catalog.errors · events       (framework-free)
application/     ports (interfaces + DI tokens) · ProductService (use cases)  (framework-free)
infrastructure/  in-memory repositories · stub/system adapters               (implements ports)
presentation/    controller · DTOs (createZodDto) · mappers · Swagger
catalog.module.ts  binds ports → adapters, exposes the controller
```

`ProductService` holds every invariant (SKU uniqueness, valid references, "≥1 variant",
delete/archive guards) and depends only on **ports** — never on Mongoose, Nest, or another module's
repository. Cross-context stock facts come through `InventoryQueryPort` (read-only).

## What is wired today vs. deferred

| Concern | Today | Becomes |
|---------|-------|---------|
| Persistence | `InMemory*Repository` (singletons) | Mongoose adapters (DB module) — same ports |
| Stock guards | `StubInventoryQuery` (returns zero) | real `InventoryQueryPort` (Inventory module) |
| References (category/brand/unit) | ✅ `LookupCatalogReference` → Catalog Lookups module (live, same-tenant checks) | Mongoose-backed lookups (DB module) |
| Tenant context | `DevAuthGuard` (header, non-prod only; fails closed in prod) | Better Auth `AuthContext` |
| Permissions | `@RequirePermission(...)` metadata (declared) | enforced by RBAC `PermissionGuard` (auth module) |
| Events | `LoggingEventPublisher` (Pino) | event bus / outbox (queues phase) |
| Bulk import | not wired | `imports` BullMQ job (queues phase) |

Swapping any adapter is a one-line change in `catalog.module.ts`; the application layer is untouched.

## Validation & Swagger

Request/query DTOs are `createZodDto(...)` classes over the shared `@stockflow/types` schemas — the
**single source** for validation (global `ZodValidationPipe`) and types. OpenAPI schemas are emitted from
the same Zod schemas via `zodToOpenAPI` in the controller's `@ApiBody`/`@ApiResponse` decorators. Validation
failures map to the standard `{ error: { code: 'VALIDATION_ERROR', details, requestId } }` envelope.

> Do **not** call `nestjs-zod`'s `patchNestJsSwagger()` — it deep-imports a `@nestjs/swagger@11` internal
> that is no longer exported and crashes at boot. See ADR-008.

## API

Base `/api/v1/products` (URI versioning). Endpoints + permissions are in
[`docs/modules/product.md` §5](../../../../../docs/modules/product.md). Health stays unversioned at `/api/health`.

## Running

```bash
pnpm --filter @stockflow/api test        # vitest unit suite (domain + service + contracts)
pnpm --filter @stockflow/api typecheck
pnpm --filter @stockflow/api build

# local run (dev tenant via header):
pnpm --filter @stockflow/api dev
curl -H 'x-organization-id: org-1' -H 'content-type: application/json' \
  -X POST localhost:3001/api/v1/products \
  -d '{"name":"Widget","baseUnitId":"aaaaaaaaaaaaaaaaaaaaaaaa","variants":[{"sku":"wid-1"}]}'
```

## Tests

- `domain/sku.test.ts` — SKU normalization/validation.
- `application/product.service.test.ts` — all use cases against in-memory repos + fakes: create
  (happy/duplicate/invalid-ref), tenant isolation, list/filter/paginate, update, archive/restore,
  soft-delete + stock guards, variant add/update/delete + last-variant/in-use guards.
- `catalog.contracts.test.ts` — Zod contract accept/reject (required variant, strict unknown-field
  rejection, SKU normalization, query coercion/limits).
