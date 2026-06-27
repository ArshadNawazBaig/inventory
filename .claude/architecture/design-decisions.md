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

### ADR-018 — Locations (Warehouses · Locations) — base for warehouses, bespoke for the tree
- Status: Accepted · Context: Wave 3. Stock is tracked at a `locationId`; the physical network is a
  Warehouse → Zone → … → Bin tree (DATABASE §5, ADR-004). Inventory/Transfers/PO/SO will reference it.
- Decision: one `locations` module with two entities. **Warehouse** rides the shared `common/resource` base
  (like a party: optional unique `code`, embedded `address`) plus a `findDefault` lookup enforcing an
  at-most-one-`isDefault`-per-tenant invariant. **Location** is **bespoke** — codes are unique *within a
  warehouse* (not tenant-wide), names are not unique, and the node carries a materialized `path` (slash-joined
  ancestor codes). It composes the same primitives (id/clock/events, generic not-found/duplicate errors) but
  does not inherit the name-keyed base. Parent validation enforces same-warehouse + acyclic; changing a
  code/parent re-materializes descendants' paths; delete is refused while a node has live children (409).
  The module exports `LocationQuery` (warehouse/location existence) for Inventory.
- Consequences: a clean fit where the base fits and an honest bespoke service where it doesn't (composition
  over a leaky abstraction). **Two DRY promotions this wave:** (a) the identical `ObjectIdGenerator` /
  `SystemClock` and a parameterised `LoggingResourceEventPublisher(channel)` moved into `common/resource`
  (catalog-lookups + parties refactored onto them, bound via `useValue`); (b) the embedded `Address` +
  `buildAddress` moved to `common/address`, and the web address form (`@/lib/address-form` +
  `@/components/address-fields`) promoted out of parties — both now shared by warehouses. New archive/restore
  POST actions return **200** via `@HttpCode(200)`, setting the standard (product/lookups/parties
  back-fill remains a small follow-up). Four permission keys (`{warehouse,location}.{view,manage}`) to sync
  into AUTHENTICATION §10. Deferred: stock-in-location delete guard (needs Inventory), default
  auto-promotion on delete, Mongoose adapters + materialized-path indexes, location-tree bulk import.

### ADR-019 — Inventory (the keystone): immutable ledger + projection, one-way deps
- Status: Accepted · Context: Wave 4. Stock accuracy is the product (ADR-002). Stock is tracked per
  (variant × location); reads must be O(1) but provably correct.
- Decision: an `inventory` module that **owns all ledger writes**. `stock_movements` is append-only (never
  updated/deleted); `stock_levels` is a persisted projection (`onHand ≡ Σ delta`, `available = onHand −
  reserved`) recomputed in the **same unit of work** as each ledger write (the transaction boundary;
  Mongoose wraps it in a session later). The manual write is an **adjustment** (`type=adjustment`,
  `reason.kind=manual`); receipts/shipments/transfers/counts/returns post through the same service in later
  waves. Enforces: non-zero delta, live variant+location refs, negative-stock policy (stub disallows;
  Settings wires it), idempotency via `opKey`, and weighted-average valuation on costed inbound deltas.
  Exports `InventoryQuery` (the `getVariantStockSummary` read-model). Added `CatalogQuery.variantExists` to
  the catalog module (exported) for reference validation. **Also aligned the Catalog module's id generator
  to the shared `ObjectIdGenerator` (24-hex)** — it was the last holdout still minting UUIDs, which failed
  Inventory's `variantId` 24-hex contract (the same lesson as ADR-015; caught in the live smoke).
- Consequences: the keystone invariant lives in one place and is reconcilable (`onHand == Σ delta` from the
  ledger). **Dependency direction is one-way: Inventory → Catalog and Inventory → Locations** (no cycle).
  Product's variant-delete guard is **deliberately left on `StubInventoryQuery`** this wave: wiring the real
  read-model back into Catalog would create a Catalog ↔ Inventory circular module dependency, which
  dependency-rules forbids (enforced in CI; `forwardRef` would still cycle). The correct integration is a
  domain event / shared read model — a recorded follow-up. Two permission keys
  (`inventory.{view,adjust}`) to sync into AUTHENTICATION §10. Deferred: reservations create/release +
  shipments (Sales), PO-costed receipts (Purchasing), transfer `inTransit` legs, count approval, tenant
  `allowNegativeStock` (Settings), Mongoose adapters + reconciliation job, zero/three-decimal currencies.

### ADR-020 — Purchasing & Sales: orders that move stock through Inventory
- Status: Accepted · Context: Wave 5. POs bring stock in; SOs send stock out. Both must move stock only
  through the one ledger writer (Inventory) and preserve historical accuracy on their lines.
- Decision: two modules — `purchasing` (Purchase Orders) and `sales` (Sales Orders) — each a header +
  **embedded lines that snapshot sku/name (+ price) at order time**, a per-tenant `PO-####`/`SO-####`
  sequence, denormalized totals, and a status machine (PO: draft→submitted→partially_received→received,
  +cancel; SO: draft→confirmed→partially_fulfilled→fulfilled, +cancel). **Receiving** posts `receipt`
  movements (costed → weighted-average) and **fulfilling** posts `shipment` movements (negative-guarded),
  both through a generalized `InventoryService.postMovement` exposed as `receive()`/`ship()` (Inventory
  stays the single ledger writer). Receipts/shipments are **idempotent** on a deterministic
  `opKey = {po|so}:{id}:{lineId}:{newQty}`. To enable this, Inventory now **exports `InventoryService`**;
  Parties exports a new **`PartyQuery`** (supplier/customer exists + name); Catalog's `CatalogQuery` gained
  **`getVariantSnapshot`**; Locations' `LocationQuery` gained **`findWarehouseId`**.
- Consequences: orders never touch the ledger directly; the `onHand == Σ delta` invariant holds. Dependency
  direction is one-way: Purchasing/Sales → {Catalog, Parties, Locations, Inventory} — no cycles. A receive
  must target a location in the PO's warehouse (422); over-receive/over-fulfil → 409; insufficient stock at
  ship surfaces from Inventory as 409 (no line advanced). Frontend extracts a shared `features/orders`
  (`OrderForm` with a dynamic line editor + `OrderStatusBadge`) reused by both. Permission keys
  `purchase_order.{view,manage}` + `sales_order.{view,manage}` to sync into AUTHENTICATION §10. Deferred:
  PO approval/`closed`, edit-draft UI, landed cost/tax, supplier-price defaults, Mongoose adapters +
  `counters`. **Transaction note:** movement + order-state writes are sequential in-memory (validated first);
  Mongoose wraps them in a session (DATABASE §11).

### ADR-021 — Sales-order ATP reservations deferred (ship-time guard only)
- Status: Accepted · Context: DATABASE §8 models `reservations` that confirm-an-SO would create to reduce
  `available`; the Inventory projection already carries `reserved`/`available`.
- Decision: **do not** build reservations in Wave 5. SO `confirm` is a status lock only; overselling is
  prevented by the immutable ledger + the negative-stock guard at `fulfill` (ship) time.
- Consequences: correct and shippable now (physical stock can't go negative). `available` equals `onHand`
  until this lands. **Follow-up:** add `reservations` (reserve on confirm at an allocated location, release
  on ship/cancel/expire), wire `reserved`/`available` upkeep into `InventoryService`, and surface ATP — needs
  an allocation decision (which location/bin), so it is its own iteration.

### ADR-022 — Transfers: two-leg inter-location moves through Inventory
- Status: Accepted · Context: Wave 6. Multi-warehouse tenants move stock between locations; this must go
  through the one ledger writer and preserve valuation. The contracts already reserved `transfer_out`/
  `transfer_in` movement types + a `transfer` reason kind (ADR-019 / DATABASE §6, §9).
- Decision: a **transfer is a two-leg document** — `draft → in_transit → partially_received → completed`
  (`cancel` from draft only). **Dispatch** posts a `transfer_out` per line from the source (negative-guarded)
  and **captures the source's running average onto the line**; **receive** posts a `transfer_in` per line into
  the (fixed) destination **at that captured cost**, so value moves with the goods. Both legs route through new
  `InventoryService.transferOut/transferIn` methods (Inventory stays the single writer) and are **idempotent**
  on `opKey = transfer:{id}:{lineId}:{out|in:newQty}`. Locations' `LocationQuery` gained `getLocationLabel`
  for source/destination snapshots.
- Consequences: dependency direction is one-way (Transfers → {Catalog, Locations, Inventory}); no cycles. The
  `onHand == Σ delta` invariant holds; once dispatched, stock can only be reconciled by receiving (no cancel).
  **In-transit stock is not on-hand at either location** this wave — the per-transfer `dispatchedQty −
  receivedQty` is the authoritative figure; a `stock_levels.inTransit` projection is a documented follow-up.
  Receive is per-line and partial; can't exceed the in-transit quantity (409). Frontend reuses Inventory's
  cascading `LocationPicker` (extended with an optional `label`) + the shared `OrderStatusBadge`. Permission
  keys `transfer.{view,manage}` to sync into AUTHENTICATION §10. Same transaction note as ADR-020 (Mongoose
  session later).

### ADR-023 — Returns: one `kind`-discriminated module, atomic completion
- Status: Accepted · Context: Wave 6. Goods flow back both ways — customers return to us, we return to
  suppliers. The contracts reserved `return_in`/`return_out` movement types; a `return` reason kind was added.
- Decision: **one Returns module** discriminated by `kind` (`customer` | `supplier`) rather than two
  near-identical modules — a customer return posts `return_in` (inbound), a supplier return posts `return_out`
  (outbound, negative-guarded), both via new `InventoryService.returnInbound/returnOutbound`. Lifecycle is
  minimal — `draft → completed` (`cancel` from draft) — and **completion is atomic** (all lines post at once);
  idempotent on `opKey = return:{id}:{lineId}`. The party is validated against its kind via the existing
  `PartyQuery` (supplier+customer exists/name), bound directly as the module's `PartyRef`.
- Consequences: one-way deps (Returns → {Catalog, Parties, Locations, Inventory}); no cycles. Customer returns
  re-enter stock uncosted (current average preserved); supplier returns are negative-guarded (409 on
  insufficient stock). **No partial completion** and **no order linkage / quantity-against-original validation**
  this wave — both are documented follow-ups (return at original cost; cap returned qty by shipped/received).
  Permission keys `return.{view,manage}` to sync into AUTHENTICATION §10.

### ADR-024 — Audit logs via a global interceptor, not per-module events
- Status: Accepted · Context: Wave 7. The audit trail must record who-did-what for **every** mutation
  (database/audit-logs.md, security/audit.md), but the event landscape is fragmented — resource modules emit
  `ResourceEvent`, catalog a bespoke `EventPublisher`, inventory `InventoryEvent`, and the **order modules emit
  nothing**; none of the events carry the actor.
- Decision: capture audit at a single **global `AuditInterceptor`** that records every successful mutating
  request (`POST`/`PATCH`/`PUT`/`DELETE`). It runs after the guards (only authorized actions) on the success
  path (close to the write; clients can't bypass it). `{ action, entityType, entityId }` is derived from the
  route by a **pure, exhaustively-tested helper** (sub-action → past-tense verb, else HTTP method; id from
  `:id`/created entity); actor + `{ ip, userAgent, requestId, method, path, statusCode }` come from the request.
  Writes flow through a cross-cutting **`AUDIT_RECORDER`** port (in `common/audit`) that the `AuditModule` binds
  to its `AuditService`. Recording is **best-effort** — failures are logged, never break the user's request.
- Consequences: uniform coverage of **all** modules (incl. orders) with **zero per-module churn** and no new
  inter-module deps — `AuditModule` depends on nothing; the interceptor is wired once in `app.module` → no
  cycles. The trail is immutable/append-only; read-only API (`audit.view`), tenant-scoped (cross-tenant → 404).
  Rejected: wiring each module's fragmented event publishers into audit; coarse HTTP-only logging. Follow-ups:
  domain callers can use the same `AUDIT_RECORDER` for redacted `before`/`after` diffs; audit security-relevant
  **denials** (403/tenant/rate-limit); async **export** (`audit.export`) via BullMQ; Mongoose adapter (immutable
  collection + per-tenant retention). Permission keys `audit.{view,export}` to sync into AUTHENTICATION §10.

## Open decisions (need ratification)
- Package manager/task runner (pnpm + Turborepo proposed).
- Inventory valuation method default (weighted-average proposed).
- Monetization shape (hybrid seats + usage caps proposed).
