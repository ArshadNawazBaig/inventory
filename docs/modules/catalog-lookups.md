# Catalog Lookups Module (Categories · Brands · Units)

| Field | Value |
|-------|-------|
| **Document** | Catalog Lookups Design (Catalog bounded context) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/catalog-lookups`](../../apps/api/src/modules/catalog-lookups) · frontend [`apps/web/src/features/lookups`](../../apps/web/src/features/lookups) |
| **Phase** | Module design + Backend + Frontend (Wave 1 of the post-Product roadmap) |
| **Depends on** | [product.md](./product.md) (it replaces that module's `StubCatalogReference`) · DATABASE §4 (catalog) |
| **Owner** | Backend Lead / Principal Architect |

> The three sibling **reference lookups** the Product module points at by id: **Categories**, **Brands**,
> **Units**. Product *references* them; it does not own them ([product.md §1](./product.md)). Implementing
> these replaces `StubCatalogReference` with real, tenant-scoped existence checks and turns the Product
> form's raw-id inputs into real pickers. Decisions are written **Decision → Why → Rejected**.

---

## 1. Scope & boundary

**Owns:** `categories`, `brands`, `units` — small, tenant-scoped reference entities (CRUD + archive +
soft-delete). **Units** are the unit of measure referenced by `product.baseUnitId` and `variant.unitId`;
**Categories** and **Brands** classify products.

**Referenced by:** the Product module (by id). Product validates these via the `CatalogReferencePort`,
which is now backed by this module (see [§8](#8-architecture)).

> **Decision** — model the three as one **lookup family** behind a shared generic base, not three
> bespoke modules. **Why** — they share ~90% of their shape and behaviour (name + description + status +
> soft-delete + name-uniqueness); a shared `LookupService<T>`/`LookupRepository<T>` removes duplication
> and makes the next simple lookup trivial. **Rejected** — three copy-pasted modules (DRY violation), and
> a single polymorphic `lookups` collection with a `type` discriminator (loses per-type fields/indexes
> and per-type permissions).

---

## 2. Entities

All three extend a common **lookup envelope**; each adds a small number of type-specific fields.

**Shared (`LookupEntity`)** — standard fields (`id, organizationId, createdAt, updatedAt, deletedAt,
createdBy, updatedBy`) plus:

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `name` | `string` | Required, 1–120, trimmed. **Unique among live rows per tenant per type** (case-insensitive). |
| `description` | `string \| null` | ≤ 2 000 chars. |
| `status` | `enum<active, archived>` | Lifecycle ([§7](#7-workflow)). No `draft` (lookups are simple). |

| Type | Extra field | Notes / invariant |
|------|-------------|-------------------|
| **Category** | `parentId: ObjectId \| null` | Optional parent (one tree). Must be a live, same-tenant category; not self; **no cycles**. |
| **Brand** | `website: string \| null` | Optional URL. |
| **Unit** | `code: string` | Short symbol (e.g. `kg`, `ea`), 1–16. **Unique among live rows per tenant** (case-insensitive). |

---

## 3. DTOs

Zod schemas in `packages/types` (`catalog-lookups.ts`); one contract, client + server. Requests are
**`.strict()`** (no mass assignment); responses are explicit allow-lists. Server-derived fields
(`id`, `organizationId`, audit, `status`) are never accepted from input.

| DTO | Key fields |
|-----|-----------|
| `Create{Category,Brand,Unit}Request` | `name` (+ `parentId?` / `website?` / `code`) `, description?` |
| `Update{...}Request` | partial of the above (no `status` — that's archive/restore) |
| `LookupListQuery` | `page?`, `limit?` (≤100, def 20), `sort?` (`name` default, `createdAt`, `updatedAt`), `status?`, `q?` (name) |
| `{...}Response` | `{ id, name, description, status, createdAt, updatedAt }` (+ `parentId` / `website` / `code`) |
| `{...}ListResponse` | `{ data: [...], meta: { page: { page, limit, total, totalPages } } }` |

---

## 4. Validation (layered)

1. **Transport (Zod DTO):** types, lengths, enum membership, URL format (brand), code pattern (unit),
   `.strict()`.
2. **Domain (service):** **name uniqueness** among live rows per tenant per type → 409 `CONFLICT`;
   **unit `code` uniqueness** → 409; category **parent** must be live + same-tenant + not self + acyclic
   → 422 `VALIDATION_ERROR`.
3. **Persistence:** partial unique indexes on `(organizationId, lower(name))` and `(organizationId,
   lower(code))` filtered to live rows are the atomic backstop (DATABASE §9).
4. **Output:** explicit mapper; internal fields never serialized.

All checks are tenant-scoped; a cross-tenant id is treated as not-found (no existence leak).

---

## 5. API

Base `/api/v1`. Plural kebab-case resources; archive/restore are POST sub-resource verbs. Every endpoint:
AuthContext required, permission-gated, tenant-scoped, Swagger-documented. The table is identical across
the three resources (`categories` · `brands` · `units`):

| Method | Path | Permission | Success |
|--------|------|-----------|---------|
| GET | `/{resource}` | `{type}.view` | 200 (list) |
| POST | `/{resource}` | `{type}.manage` | 201 |
| GET | `/{resource}/:id` | `{type}.view` | 200 |
| PATCH | `/{resource}/:id` | `{type}.manage` | 200 |
| DELETE | `/{resource}/:id` | `{type}.manage` | 204 (soft-delete) |
| POST | `/{resource}/:id/archive` | `{type}.manage` | 200 |
| POST | `/{resource}/:id/restore` | `{type}.manage` | 200 |

**Errors:** `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `NOT_FOUND` 404 (incl. cross-tenant) ·
`CONFLICT` 409 (duplicate name/code) · `VALIDATION_ERROR` 422 (bad/cyclic parent). Every response carries
`requestId`.

---

## 6. Permissions

Two permissions **per resource**, deny-by-default, enforced server-side (UI mirrors only):

| Permission | Grants | Default system roles |
|-----------|--------|----------------------|
| `category.view` / `brand.view` / `unit.view` | read + list/search | all roles with `product.view` |
| `category.manage` / `brand.manage` / `unit.manage` | create · update · delete · archive · restore | Owner, Admin, Inventory Manager |

> **Decision** — **two** verbs per resource (`view`, `manage`), not four (`create/update/delete/...`).
> **Why** — managing reference data is a single access boundary (the same roles that can create a category
> can edit/retire it); four verbs would bloat the catalog without a real authorization distinction.
> **Rejected** — mirroring Product's four-verb set (no distinct boundary here) and one shared
> `catalog.manage` across all three (loses per-type granularity an admin may want). **Action:** sync these
> six keys into AUTHENTICATION §10 on approval.

---

## 7. Workflow

```
   create
(none) ─────▶ active ──archive──▶ archived ──restore──▶ active
                 │                                          ▲
                 └──────────── delete (soft) ───────────────┘  (restore undeletes → active)
```
- **active** — usable as a reference in products.
- **archived** — hidden from pickers but kept + referenceable in history.
- **soft-deleted** — `deletedAt` set; hidden; restorable; frees the name/code for reuse.

> **Decision** — deleting a lookup that products still reference is **not blocked** in this wave (soft
> delete only; the product keeps a dangling optional id until edited). **Why** — a referential guard or
> set-null needs a usage read-model and would couple lookups → catalog (a cycle with the reference port).
> **Rejected (for now)** — synchronous cross-module "in use?" check (creates a dependency cycle).
> **Follow-up** — a usage port / event-driven cleanup once the reporting read-model exists.

---

## 8. Architecture

Clean Architecture, shared generic base (`apps/api/src/modules/catalog-lookups`):
```
domain/         LookupEntity + Category/Brand/Unit entities · lookup.errors · name normalization
application/    LookupRepository<T> + tokens · LookupService<T> (base CRUD) · {Category,Brand,Unit}Service
                CatalogLookupQuery (exported: categoryExists/brandExists/unitExists)
infrastructure/ InMemoryLookupRepository<T> base + 3 concrete repos · id/clock/event adapters
presentation/   DTOs (createZodDto) · mappers · 3 controllers
catalog-lookups.module.ts   binds ports → adapters; EXPORTS CatalogLookupQuery
```
- `LookupService<T>` holds the shared invariants (name uniqueness, soft-delete/restore, status); concrete
  services add type rules (category parent/cycle, unit code uniqueness).
- **Cross-module seam:** the module exports `CatalogLookupQuery`; the **Catalog (Product) module** imports
  it and binds its `CATALOG_REFERENCE` port to an adapter delegating to it — replacing `StubCatalogReference`.
  In-memory repos are Nest singletons, so reads see writes. Dependency direction: catalog → lookups (Product
  references lookups), never the reverse.

---

## 9. Testing notes

- **Unit (services, fake repos):** create happy path; duplicate name → 409; unit duplicate code → 409;
  category bad/self/cyclic parent → 422; archive/restore/soft-delete + restore-frees-name; tenant isolation.
- **Contracts:** strict unknown-field rejection, URL/code validation, list query coercion/limits.
- **Reference integration:** Product create with a real (existing) category/unit passes; with an unknown id → 422.

---

## 10. Status

🟢 **Implemented** (Wave 1). On approval, sync the six permission keys into AUTHENTICATION §10. Follow-ups:
referential guard on delete; slug + full category-tree endpoints; Mongoose adapters when the DB module lands.
