# Product Module

| Field | Value |
|-------|-------|
| **Document** | Product Module Design (Catalog bounded context) |
| **Status** | 🟢 Backend implemented — [`apps/api/src/modules/catalog`](../../apps/api/src/modules/catalog) (27 tests · Swagger · validation) · 🟢 Frontend implemented — [`apps/web/src/features/products`](../../apps/web/src/features/products) ([§12](#12-frontend)) |
| **Phase** | 6–7 — Module design (API + Backend), documentation-first |
| **Depends on** | [ARCHITECTURE.md](../ARCHITECTURE.md) · [DATABASE.md](../DATABASE.md) · [AUTHENTICATION.md](../AUTHENTICATION.md) |
| **Authoritative sources** | DATABASE §4 (catalog) · AUTHENTICATION §10 (permissions) · [`.claude/api/*`](../../.claude/api) · [`.claude/backend/*`](../../.claude/backend) |
| **Owner** | Backend Lead / Principal Architect |

> Design for the **Product module** — the core of the **Catalog** bounded context. **Design only — no
> code.** Every decision is written **Decision → Why → Rejected**. It realizes the catalog slice of
> [DATABASE.md §4](../DATABASE.md) and is the first business module to follow the foundation built in the
> backend/frontend scaffolds.

---

## 1. Scope & boundary

**Owns:** `products` and `variants` (create/read/update/archive/delete + bulk import). The variant is the
sellable/stockable unit and carries the **SKU**.

**References (does not own):** `categories`, `brands`, `units` — sibling Catalog lookups, referenced by id
and validated for existence + tenant. Their own CRUD is a separate spec.

**Must NOT touch** (module-boundaries invariant): **stock quantities**. On-hand/reserved/available live in
the **Inventory** module (`stock_levels`/`stock_movements`). The Product module never reads or writes the
ledger; it only *describes* what can be stocked. When a catalog action needs stock facts (e.g. "can this
variant be deleted?"), it asks the Inventory service through its public port — never via its repository.

> **Decision** — Product describes the catalog; Inventory owns quantities; the seam between them is a
> read-only service call + domain events.
> **Why** — keeps the two highest-churn contexts decoupled and keeps the I3/I4 ledger invariants
> enforceable in exactly one place (Inventory). A catalog bug can never corrupt stock.
> **Rejected** — embedding `onHand` on the variant (couples catalog to ledger, breaks the single-writer rule).

```
Catalog (this module)            Inventory (separate)
  Product 1─* Variant ──referenced by──▶ stock_levels / stock_movements (variantId)
  Category/Brand/Unit ──referenced──▶ Product
```

---

## 2. Entities

Domain model (persistence detail is canonical in [DATABASE §4](../DATABASE.md); module-relevant fields +
invariants shown here). IDs are branded types from `packages/types` (`ProductId`, `VariantId`).

### 2.1 Product (catalog parent)
| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `id` | `ProductId` | Server-generated. |
| `organizationId` | `OrganizationId` | Tenant (server-derived; never from input). |
| `name` | `string` | Required, 1–200 chars, trimmed. |
| `description` | `string \| null` | ≤ 5 000 chars. |
| `categoryId` / `brandId` | `ObjectId \| null` | Must reference a live row in the **same tenant**. |
| `baseUnitId` | `ObjectId` | Required; same-tenant `units` row. |
| `attributes` | `Record<string, string>` | Tenant-defined; bounded (≤ 50 keys). |
| `imageFileIds` | `ObjectId[]` | Bounded gallery (≤ 12); same-tenant `files`. |
| `status` | `enum<draft, active, archived>` | Lifecycle ([§7](#7-workflow)). |
| `hasVariants` | `boolean` | Derived: always ≥ 1 variant exists. |
| standard fields | | `createdAt/updatedAt/deletedAt/createdBy/updatedBy/schemaVersion`. |

### 2.2 Variant (sellable / stockable unit — carries the SKU)
| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `id` | `VariantId` | Server-generated. |
| `organizationId` | `OrganizationId` | Tenant. |
| `productId` | `ProductId` | Parent; immutable after creation. |
| `sku` | `string` | **Unique per live variant per tenant** (partial unique index, DATABASE §9.2). 1–64 chars, `[A-Z0-9-_]`, uppercased on normalize. |
| `barcode` | `string \| null` | UPC/EAN; unique per tenant when present. |
| `attributes` | `Record<string,string>` | Variant axes (e.g. `{ color: "red", size: "M" }`). |
| `unitId` | `ObjectId` | Stock-keeping unit; same tenant. |
| `reorderPoint` / `reorderQty` | `int ≥ 0` | Low-stock thresholds (drive alerts). |
| `defaultPriceMinor` + `currency` | `Money` | Integer minor units + ISO-4217. |
| `status` | `enum<active, archived>` | A variant may be retired independently. |

**Value objects / invariants** — `Sku` (normalized, format-validated, tenant-unique); `Money` (integer
minor units + currency, never float); a Product **always has ≥ 1 active-or-archived variant** (cannot
delete the last one); `productId` and `organizationId` are immutable.

---

## 3. DTOs

Zod schemas live in `packages/types` (one contract, client + server). Request DTOs are **`.strict()`**
(unknown fields rejected → no mass assignment); Response DTOs are explicit allow-lists (no Mongoose docs).
Server-derived fields (`id`, `organizationId`, audit, `status` transitions, `hasVariants`) are **never**
accepted from input.

### 3.1 Requests
| DTO | Key fields | Notes |
|-----|-----------|-------|
| `CreateProductRequest` | `name`, `description?`, `categoryId?`, `brandId?`, `baseUnitId`, `attributes?`, `imageFileIds?`, **`variants: CreateVariantInput[]` (≥1)** | Creates product + initial variant(s) atomically ([§7.2](#72-create-product-transaction)). `status` defaults to `draft`. |
| `CreateVariantInput` / `CreateVariantRequest` | `sku`, `barcode?`, `attributes?`, `unitId?`, `reorderPoint?`, `reorderQty?`, `defaultPriceMinor?`, `currency?` | Nested in create, or standalone `POST .../variants`. |
| `UpdateProductRequest` | partial of product fields (no `variants`, no `status`) | Variants + status change via their own endpoints. |
| `UpdateVariantRequest` | partial of variant fields (no `productId`) | SKU change re-validates uniqueness. |
| `ListProductsQuery` | `page?`/`cursor?`, `limit?` (≤100, def 20), `sort?`, `filter[status]?`, `filter[categoryId]?`, `filter[brandId]?`, `q?` | Allow-listed ([§5](#5-api)). |
| `ImportProductsRequest` | `fileId`, `mode: create\|upsert`, `opKey` | Async bulk import ([§7.4](#74-bulk-import-async)). |

### 3.2 Responses
| DTO | Shape |
|-----|-------|
| `ProductResponse` | `{ id, name, description, categoryId, brandId, baseUnitId, attributes, imageFileIds, status, hasVariants, variantCount, createdAt, updatedAt }` (+ `variants: VariantResponse[]` on the detail endpoint). |
| `VariantResponse` | `{ id, productId, sku, barcode, attributes, unitId, reorderPoint, reorderQty, defaultPriceMinor, currency, status, createdAt, updatedAt }` — **no stock fields** (those come from Inventory). |
| `ProductListResponse` | `{ data: ProductResponse[], meta: { page: { limit, nextCursor, hasMore } } }` (envelope per api/standards). |
| `ImportAcceptedResponse` | `{ data: { jobId } }` (202). |

> **Decision** — `VariantResponse` carries **no** `onHand`/`available`.
> **Why** — those belong to Inventory; a catalog endpoint returning stock would couple the contexts and
> risk a stale/duplicated number. UIs that need both call the catalog endpoint **and** the inventory
> endpoint (or a future read-model that joins them). **Rejected** — denormalizing stock onto the variant
> response (two sources of truth for a number that must be correct).

---

## 4. Validation (layered — validation.md)

1. **Transport (Zod DTO)** — types, required fields, lengths, enum membership, `.strict()`. `sku` matches
   `^[A-Z0-9][A-Z0-9-_]{0,63}$` (normalized uppercase, trimmed); `currency` ISO-4217; money/quantities are
   non-negative integers; `variants` non-empty on create; array bounds enforced.
2. **Domain (service)** — referential + uniqueness rules that need the DB:
   - `categoryId`/`brandId`/`unitId`/`imageFileIds` must reference **live, same-tenant** rows → else 422.
   - `sku` (and `barcode` if present) **unique among live variants in the tenant** → else 409 `CONFLICT`
     (the partial unique index is the atomic backstop, DATABASE §9.2).
   - Cannot delete the **last** variant of a product; cannot delete/archive a variant with stock or open
     orders ([§7.3](#73-delete--archive-guards)).
3. **Persistence** — schema + partial unique indexes enforce SKU/barcode uniqueness atomically even under
   race.
4. **Output (Response DTO)** — explicit allow-list mapper; internal fields never serialized.

All validation is **tenant-scoped**: referenced ids are checked within the actor's `organizationId`; a
cross-tenant id is treated as not-found (no existence leak).

---

## 5. API

Base `/api/v1`. Resource paths plural kebab-case; variants nested (≤2 levels); non-CRUD actions are POST
sub-resource verbs (api/naming). Every endpoint: AuthContext required, permission-gated, tenant-scoped,
Swagger-documented.

| Method | Path | Permission | Success | Description |
|--------|------|-----------|---------|-------------|
| GET | `/products` | `product.view` | 200 | List (paginated/filtered/sorted). |
| POST | `/products` | `product.create` | 201 | Create product + initial variant(s) (txn). |
| GET | `/products/:productId` | `product.view` | 200 | Detail (with variants). |
| PATCH | `/products/:productId` | `product.update` | 200 | Update product fields. |
| DELETE | `/products/:productId` | `product.delete` | 204 | Soft-delete (guarded). |
| POST | `/products/:productId/archive` | `product.update` | 200 | Archive (retire from selection). |
| POST | `/products/:productId/restore` | `product.update` | 200 | Restore (archived → active / undelete). |
| POST | `/products/import` | `product.import` | 202 | Async bulk import → `{ jobId }`. |
| GET | `/products/:productId/variants` | `product.view` | 200 | List variants. |
| POST | `/products/:productId/variants` | `product.update` | 201 | Add variant. |
| GET | `/products/:productId/variants/:variantId` | `product.view` | 200 | Variant detail. |
| PATCH | `/products/:productId/variants/:variantId` | `product.update` | 200 | Update variant. |
| DELETE | `/products/:productId/variants/:variantId` | `product.update` | 204 | Delete variant (guarded). |

**List endpoint allow-lists** (filtering.md/sorting.md): **filter** `status`, `categoryId`, `brandId`;
**search** `q` (name · sku · barcode); **sort** `name`, `createdAt`, `updatedAt` (default `-createdAt`,
`_id` tiebreaker). All backed by indexes from DATABASE §9.1. **Cursor pagination** is primary.

**Error envelope** (api/errors): `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 ·
`NOT_FOUND` 404 (incl. cross-tenant) · `CONFLICT` 409 (duplicate SKU/barcode, delete-last-variant) ·
`VALIDATION_ERROR`/422 (bad reference). Every response carries `requestId`.

> **Decision** — variant create/update/delete map to **`product.update`**, not a separate `variant.*`
> permission; only the *first* variant (via create-product) uses `product.create`.
> **Why** — the permission catalog (AUTHENTICATION §10) is product-grained; managing a product's variants
> *is* editing that product. Adding `variant.*` would bloat the catalog without a real authorization need.
> **Rejected** — separate variant permissions (catalog sprawl; no distinct access boundary in practice).

---

## 6. Permissions

Catalog permissions (AUTHENTICATION §10), **deny-by-default**, enforced server-side (UI mirrors only),
with object-level tenant checks (cross-tenant → 404):

| Permission | Grants | Default system roles |
|-----------|--------|----------------------|
| `product.view` | read products/variants, list/search | Owner, Admin, Inventory Mgr, Purchasing Mgr, Sales/Fulfillment, Warehouse Staff, Viewer/Auditor |
| `product.create` | create products (+ first variant) | Owner, Admin, Inventory Manager |
| `product.update` | edit products + manage variants + archive/restore | Owner, Admin, Inventory Manager |
| `product.delete` | soft-delete products | Owner, Admin, Inventory Manager |
| `product.import` | bulk CSV/XLSX import | Owner, Admin, Inventory Manager |

Warehouse-scoped operators get `product.view` only (catalog is org-wide, not warehouse-scoped). Every
mutation is **audit-logged** (actor, before/after redacted) and emits a domain event ([§7.5](#75-domain-events)).

---

## 7. Workflow

### 7.1 Lifecycle state machine
```
            create
   (none) ─────────▶ draft ──publish──▶ active ──archive──▶ archived
                       │                   ▲                    │
                       └───── publish ─────┘   ◀── restore ─────┘
   active/archived ──delete──▶ (soft-deleted)  ──restore──▶ previous status
```
- **draft** — created but not yet live (not shown in pickers/storefront); editable freely.
- **active** — live and usable in POs/SOs/stock ops.
- **archived** — retired from selection but **kept and referenceable** in history/reports (distinct from
  delete; DATABASE §12.3).
- **soft-deleted** — `deletedAt` set; hidden everywhere by default; restorable; SKU freed for reuse
  (partial unique index, DATABASE §12.2).

> **Decision** — add a **`draft`** state to the product status enum (DATABASE §4.1 currently `active |
> archived`).
> **Why** — catalog onboarding (especially bulk import) needs a staging state before a product goes live;
> publishing is an explicit, audited transition. **Action:** sync this back into DATABASE §4.1 on approval
> (recorded here to avoid silent drift). **Rejected** — modeling draft via `deletedAt` or a separate flag
> (overloads soft-delete / adds a redundant boolean).

### 7.2 Create product (transaction)
`POST /products` creates the **product + its initial variant(s) atomically** in one Mongo transaction
(idempotent via `opKey`): validate references → check SKU/barcode uniqueness → insert product (`draft`) →
insert variant(s) → emit `ProductCreated` + `VariantCreated` (after commit).

> **Decision** — product and first variant are created in **one transaction**, never as two requests.
> **Why** — the invariant "a product always has ≥1 variant" must hold at all times; a two-step create
> could leave an orphan product if step two fails. **Rejected** — create-product-then-add-variant as
> separate calls (transient invalid state, partial failure).

### 7.3 Delete / archive guards
- **Archive** is always allowed (it only hides from selection).
- **Delete** (product or variant) requires, checked via the **Inventory service port** (read-only):
  - no non-zero `onHand`/`reserved`/`inTransit` for the variant(s), and
  - no open PO/SO lines referencing the variant.
  If violated → 409 `CONFLICT` with guidance to archive instead.
- Cannot delete the **last** variant of a non-deleted product (delete the product instead).
- Stock history (`stock_movements`) is immutable and **never** removed — delete is soft; history persists.

> **Decision** — block hard-meaning deletes of catalog rows that still have stock or order references;
> steer to archive.
> **Why** — protects referential integrity with Inventory/Procurement/Sales and the audit trail; "stock
> accuracy is the product." **Rejected** — cascade-deleting stock/orders (destroys history, violates I3/I4).

### 7.4 Bulk import (async)
`POST /products/import` validates the file ref, enqueues an `imports` BullMQ job, returns **202 `{ jobId }`**.
The worker parses CSV/XLSX, **per-row validates** (same Zod schemas), upserts/creates in `draft`, reports
per-row errors, and emits progress + `ProductImportCompleted`. Idempotent via `opKey` (re-running the same
import is a no-op). Heavy work never runs in the request path (I7).

### 7.5 Domain events
Emitted after commit; consumed by decoupled handlers — **audit log** (always), **search index** (future),
**notifications** (e.g. import done). Each carries `organizationId` + correlation id.

| Event | When | Consumers |
|-------|------|-----------|
| `ProductCreated` / `ProductUpdated` | create / patch | audit · search index |
| `ProductPublished` / `ProductArchived` / `ProductDeleted` / `ProductRestored` | status transitions | audit · search index · notifications |
| `VariantCreated` / `VariantUpdated` / `VariantDeleted` | variant ops | audit · search index |
| `ProductImportCompleted` | import job done | notification (in-app + email) |

---

## 8. Architecture & layering

Clean Architecture per module (folder-structure):
```
modules/catalog/                 (Product is the first slice)
  domain/         Product, Variant entities · Sku/Money value objects · invariants
  application/    use cases (CreateProduct, UpdateVariant, ArchiveProduct, ImportProducts)
                  ports: ProductRepository, VariantRepository, InventoryQueryPort (read stock for guards)
  infrastructure/ Mongoose schemas + repositories (tenant-scoped base repo) · import adapter
  presentation/   controllers, DTOs, mappers, Swagger
  catalog.module.ts
```
- Services depend on **ports**, enforce invariants before persisting, return domain results; controllers
  map to Response DTOs.
- Repositories extend the **base tenant repository** (auto `organizationId` scoping) and are soft-delete
  aware; transactions (sessions) are passed in from the service.
- **No cross-module repository access** — stock facts come via `InventoryQueryPort` (a read-only service
  call), not by querying `stock_levels` directly.

---

## 9. Testing notes

- **Unit (services, fake ports):** create-with-variant happy path; duplicate SKU → 409; bad reference →
  422; delete-last-variant blocked; delete-with-stock blocked (fake InventoryQueryPort); archive/restore
  transitions.
- **Integration:** transactional create rolls back fully on variant failure; partial unique index frees
  SKU after soft-delete and rejects duplicate live SKU under concurrency.
- **Permission/tenant (mandatory, adversarial):** each endpoint denies without the permission (403) and
  denies cross-tenant access (404); list/search/import are tenant-scoped.
- **Import:** per-row error reporting; idempotent re-run via `opKey`.

---

## 10. Open decisions

| Topic | Proposal |
|-------|----------|
| `draft` status | Add to DATABASE §4.1 product enum (this spec) |
| SKU editability after stock history | Editable + re-validated + audited; orders/movements snapshot SKU so history stays accurate |
| Import `upsert` key | Match on `sku` within tenant |
| Search index | Defer to a Reporting/search read-model; events already emitted |
| Category/Brand/Unit CRUD | Separate Catalog sub-module specs |

---

## 11. Status

🔵 **In review.** On approval this drives the `packages/types` catalog schemas, the API spec entries, and
the `modules/catalog` backend implementation (Phase 7) on top of the existing API foundation. One
upstream sync required: add `draft` to DATABASE §4.1.

---

## 12. Frontend

🟢 **Implemented** — Phase 8 (Frontend) for this module, built entirely on `@stockflow/ui` (cardinal rule),
TanStack Query for server state, and React Hook Form + Zod for forms.

### 12.1 Layering (`apps/web/src/features/products`)
```
lib/api/                 apiRequest seam · typed ApiError · dev tenant headers   (app-wide)
features/products/
  api.ts                 one fn per endpoint (§5); validates responses via shared Zod contracts
  query-keys.ts          hierarchical key factory
  queries.ts             useProducts (keepPreviousData) · useProduct · useVariants
  mutations.ts           create/update/archive/restore/delete (+ variant ops); own cache invalidation
  lib/money.ts           major↔minor conversion (float-safe)
  lib/product-form.schema.ts   form-shape schemas + request mappers (ADR-014)
  lib/form-errors.ts     map server VALIDATION_ERROR details onto RHF fields
  components/            status badges · details/variant fields · create+edit form · variant dialog ·
                         table (server-sorted) · filters · browser (URL state) · detail view
app/(app)/products/      list · new · [productId] (detail) · [productId]/edit · loading
```

### 12.2 Decisions
> **Decision** — server state lives **only** in TanStack Query; mutations own invalidation, components own
> toasts/navigation/field-error mapping. **Why** — one source of truth for cache correctness; UX feedback
> stays where the context is. **Rejected** — mirroring server data into Zustand (two sources, drift).

> **Decision** — list **sorting/paging/filtering is server-driven** and **kept in the URL**. **Why** —
> correctness across the whole result set (TanStack `DataGrid` only sorts the current page) and shareable,
> back-button-friendly state. We compose the lower-level `Table` primitives + `Pagination` rather than the
> client-only `DataGrid`. **Rejected** — client-side sort/paginate over one page (wrong totals/order).

> **Decision** — output is validated against the shared response schemas at the client boundary; requests
> use thin **form** schemas + mappers, re-validated authoritatively by the API (ADR-014).

### 12.3 Wired today vs. deferred
| Concern | Today | Becomes |
|---------|-------|---------|
| Tenant context | dev headers outside prod (mirrors `DevAuthGuard`, ADR-013) | Better Auth session/cookies |
| Permission gating (UI mirror) | server enforces; nav/actions shown unconditionally | `@RequirePermission` → UI `PermissionWrapper` once RBAC lands |
| Category/Brand/Unit references | ✅ real `LookupSelect` pickers + server-validated existence (ADR-015) | — (variant-level unit picker still a text input; follow-up) |
| Images / attributes | omitted | image upload (Cloudinary/files) + attribute editor |
| Bulk import UI | omitted | upload → `POST /products/import` (202) + job progress |
| Component/integration tests | pure-logic vitest (mappers/money/errors/keys) + `Field` RTL in UI | jsdom + Testing Library + MSW flows |

### 12.4 New shared primitive
`Field` (label/description/error/aria host) was added to `@stockflow/ui` to make accessible forms
composable without hand-rolled markup — see [`docs/components/field.md`](../components/field.md) and ADR-012.
