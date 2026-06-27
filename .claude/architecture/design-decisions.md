# Design Decisions (ADR log)

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [PRD §13](../../docs/PRODUCT_REQUIREMENTS.md)

## Purpose
A running Architecture Decision Record. Every significant choice — including each new
dependency — is recorded here with context, decision, and consequences.

## Format
```
### ADR-NNN — <title>
- Status: Proposed | Accepted | Superseded by ADR-XXX
- Context: <forces at play>
- Decision: <what we chose>
- Consequences: <trade-offs, follow-ups>
```

## Accepted decisions (from PRD)
### ADR-001 — Multi-tenant shared DB with `organizationId` scoping
- Status: Accepted · Context: lowest ops overhead at our scale, isolation must be provable.
- Decision: shared DB; `organizationId` on every collection; enforced at data-access layer.
- Consequences: requires adversarial isolation tests; dedicated-DB option deferred to Enterprise.

### ADR-002 — Immutable stock ledger as source of truth
- Decision: append-only `stock_movements`; on-hand is a derived `stock_levels` projection.
- Consequences: every quantity is explainable; reconciliation tooling needed; no in-place edits.

### ADR-003 — Product → Variant → Stock model
- Decision: two-level catalog; SKU lives on the variant.
- Consequences: avoids the flat-SKU dead end; slightly more join/lookup work.

### ADR-004 — Hierarchical locations, bins optional
### ADR-005 — RBAC: granular permissions + system & custom roles, deny-by-default
### ADR-006 — Async-by-default heavy work via BullMQ
### ADR-007 — API-first; web is the first client

## Implementation decisions

### ADR-008 — `nestjs-zod` for the Zod ↔ Swagger bridge (API)
- Status: Accepted · Context: DTOs/contracts are Zod schemas in `packages/types`; Swagger must be
  generated from them without a duplicate set of class DTOs (DRY golden rule).
- Decision: add `nestjs-zod`. Use `createZodDto` for request/query DTO classes (validated by the
  global `ZodValidationPipe`) and `zodToOpenAPI` to emit OpenAPI schemas in `@ApiBody`/`@ApiResponse`.
- Consequences: one source of truth for validation + types + docs. **Do not call `patchNestJsSwagger()`**
  — it deep-imports a `@nestjs/swagger@11` internal that is no longer exported (crashes at boot);
  `zodToOpenAPI` is used instead. Validation errors are mapped to the standard envelope in the global filter.

### ADR-009 — `vitest` as the API test runner
- Status: Accepted · Context: the monorepo already standardizes on Vitest (`packages/ui`); NestJS
  services are plain classes testable without the Nest runtime.
- Decision: `vitest` (node environment) for `apps/api`; services unit-tested against in-memory/fake ports.
- Consequences: fast, framework-free tests; `*.test.ts` excluded from `nest build`.

### ADR-010 — Ports-and-adapters with in-memory adapters until the DB module lands
- Status: Accepted · Context: the database module (Mongoose connection + base tenant repository) and the
  Inventory module are deferred; the Product module must still ship runnable + tested.
- Decision: application depends on repository/query **ports**; bind them to in-memory repositories and
  stub Inventory/reference adapters now. The Mongoose adapters implement the same ports and drop in later
  with zero application-layer change (dependency inversion).
- Consequences: data is non-persistent until the DB module; the transaction boundary documented in
  product.md attaches with the Mongoose session. Bulk import (needs BullMQ) and RBAC enforcement (needs
  the auth module) are encoded as seams (`@RequirePermission`, `InventoryQueryPort`) but not yet wired.

### ADR-011 — Temporary dev tenant guard (replaced by Better Auth)
- Status: Accepted (temporary) · Context: no auth module yet, but the API must be runnable locally.
- Decision: `DevAuthGuard` reads `x-organization-id`/`x-user-id` **in non-production only**; in production
  it is a no-op, so tenant-scoped endpoints fail closed (401) until the real AuthGuard lands. The tenant is
  never read from the request body (tenant-isolation.md).
- Consequences: local runnability without weakening production; removed when Better Auth provides AuthContext.

### ADR-012 — `Field` primitive as the label/error/aria host (UI)
- Status: Accepted · Context: `Input`/`Textarea`/`Select`/etc. are intentionally bare; their docstrings
  already point labels + messages at a `Field` host that hadn't been built. The Product frontend needs
  accessible forms, and the cardinal rule forbids hand-rolling label/error markup in app pages.
- Decision: implement `Field` (+ `FieldLabel`/`FieldDescription`/`FieldError`/`FieldControl`) in
  `packages/ui`. `Field` owns the generated ids and wires `htmlFor` / `aria-describedby` /
  `aria-invalid` / `aria-required`; `FieldControl` clones the wrapped control with that wiring (and the
  `invalid` flag on error). Works with native inputs (RHF `register`) and Radix controls (wrap the
  `SelectTrigger`). Shipped with 8 tests + stories + spec (`docs/components/field.md`).
- Consequences: pages compose accessible forms entirely from `@stockflow/ui`; one place owns a11y wiring.
  A `FieldSet` (radio/checkbox groups via `fieldset`/`legend`) is a future follow-up.

### ADR-013 — Web data layer + dev tenant header parity (web)
- Status: Accepted · Context: the web client must talk to the API (api-first), surface the standard error
  envelope, and supply tenant context — without weakening the production posture before Better Auth lands.
- Decision: a single `apiRequest` seam (`apps/web/src/lib/api`) adds JSON headers, throws a typed
  `ApiError` (code/status/details/requestId) on any non-2xx or transport failure, and validates success
  bodies against the shared Zod response contracts (output validation). Tenant context is attached as
  `x-organization-id`/`x-user-id` **only outside production**, mirroring the API's `DevAuthGuard`
  (ADR-011); production derives the tenant server-side and these headers are absent. Server state lives in
  TanStack Query (keys in one factory; mutations own invalidation); user feedback/navigation/field-error
  mapping live in components.
- Consequences: identical fail-closed behaviour on both tiers; swapping to Better Auth cookies is a change
  in one file. React Hook Form + `@hookform/resolvers` (RHF is in the authoritative stack) added to web.

### ADR-014 — Form-shape vs wire-shape schemas (web)
- Status: Accepted · Context: the shared `@stockflow/types` contracts model the *request* (integer
  minor-unit money, transformed/uppercased SKUs, strict objects); a form models *human input* (all-string
  fields, major-unit decimal prices, blank = unset).
- Decision: keep the shared contract as the single wire source of truth, and add thin **form** schemas +
  mappers (`product-form.schema.ts`) for instant UX validation and major↔minor conversion. The API
  re-validates authoritatively (the SKU transform, partial unique index, reference checks are server-side).
- Consequences: one contract, two representations — not a duplicated source of truth. Money parsing is
  done manually (not `* 100`) to avoid float error; a 2-decimal minor exponent is assumed (zero/three-
  decimal currencies are a documented follow-up).

### ADR-015 — Catalog Lookups as a shared-base lookup family (Categories · Brands · Units)
- Status: Accepted · Context: Product references category/brand/unit by id and stubbed their existence
  (`StubCatalogReference`). The three are near-identical tenant-scoped reference entities.
- Decision: implement them as **one module** behind a generic `LookupService<T>`/`LookupRepository<T>`
  base (shared CRUD + name uniqueness + soft-delete/restore), with thin concrete services for the
  type-specific rules (category parent + cycle check, unit code uniqueness). The module **exports a
  `CatalogLookupQuery`**; the Catalog module binds its `CATALOG_REFERENCE` port to a delegating adapter
  (`LookupCatalogReference`) — replacing the stub. Frontend mirrors this with a generic `LookupManager`
  + `LookupSelect` (config/descriptor-driven), and the Product form's id-inputs become real pickers.
- Consequences: a product's references are now validated (live, same tenant → 422 otherwise); the next
  simple lookup is cheap. **In-memory lookup ids are 12-byte hex (ObjectId-shaped), not UUIDs**, because
  reference fields are validated as 24-char hex — UUIDs would fail those validators (caught in
  integration). Dependency direction is catalog → lookups. Deferred: a delete-in-use guard (needs a
  usage read-model; would cycle), slug + full category-tree endpoints, and a variant-unit picker.
- Permissions: six new keys (`{category,brand,unit}.{view,manage}`) to sync into AUTHENTICATION §10.

### ADR-016 — Shared resource toolkits (frontend `features/resources` + backend `common/resource`)
- Status: Accepted · Context: catalog lookups and parties (and most future simple CRUD modules) are all
  tenant-scoped, named, status'd, soft-deletable resources with identical list/admin/lifecycle behaviour.
- Decision: extract the generic pieces once and reuse them:
  - **Frontend** `features/resources` — `ResourceDescriptor`, generic api/query/mutation hooks,
    `ResourceManager` (search + status filter + pagination + edit/archive/restore/delete), and
    `ResourceSelect` (picker). Resources supply only a descriptor, extra columns, and a concrete form dialog.
  - **Backend** `common/resource` — `ResourceEntity`, `ResourceRepository<T>` port, `ResourceService<T>`
    base (CRUD + name/field uniqueness + soft-delete/restore), `InMemoryResourceRepository<T>`, and the
    generic `ResourceNotFoundError`/`DuplicateResourceError`. Catalog Lookups was refactored onto it.
- Consequences: a new simple-CRUD module is now a thin descriptor + form, not a copy. Uniqueness beyond
  `name` is supported via `assertFieldAvailable(field)` (unit `code`, party `code`); restore re-checks via
  an overridable `assertRestorable` hook (parties override it because their names are not unique). The
  `money` helper was promoted to `@/lib/money` (shared by product prices + customer credit limits).

### ADR-017 — Parties (Suppliers · Customers) on the shared base
- Status: Accepted · Context: Wave 2 of the post-Product roadmap; the external parties PO/SO will reference.
- Decision: one `parties` module with `SupplierService`/`CustomerService` on `ResourceService`; parties are
  keyed by an optional unique `code` (names not unique), carry contact fields + an embedded `Address`, and
  add type-specific fields (supplier: currency/paymentTerms/leadTimeDays; customer: customerType/creditLimit).
- Consequences: no cross-module reference export yet (`PartyQuery` arrives with Purchasing/Sales); delete is
  soft-only (referential guard deferred to the order read-models). Four permission keys
  (`{supplier,customer}.{view,manage}`) to sync into AUTHENTICATION §10. **Note:** archive/restore POST
  actions currently return 201 (Nest default) where docs say 200 — harmless (2xx); a `@HttpCode(200)`
  standardization across product/lookups/parties is a small follow-up.

## Open decisions (need ratification)
- Package manager/task runner (pnpm + Turborepo proposed).
- Inventory valuation method default (weighted-average proposed).
- Monetization shape (hybrid seats + usage caps proposed).
