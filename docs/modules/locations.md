# Locations Module (Warehouses · Locations)

| Field | Value |
|-------|-------|
| **Document** | Locations Design (physical network) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/locations`](../../apps/api/src/modules/locations) · frontend [`apps/web/src/features/locations`](../../apps/web/src/features/locations) |
| **Phase** | Module design + Backend + Frontend (Wave 3) |
| **Depends on** | [catalog-lookups.md](./catalog-lookups.md) (shared resource base) · DATABASE §5 · ADR-004 |
| **Owner** | Backend Lead / Principal Architect |

> The tenant's physical network: **Warehouses** (sites that hold stock) and **Locations** (a per-warehouse
> Warehouse → Zone → … → Bin tree). Stock is tracked at a `locationId`; on-hand roll-ups use the
> materialized `path`. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary

**Owns:** `warehouses`, `locations`. **Referenced by (later):** Inventory (`locationId` on every stock
movement/level), Transfers (`fromLocationId`/`toLocationId`), Purchasing/Sales (receiving/fulfilment
warehouse). Locations do **not** own stock quantities — those live in the immutable ledger (Inventory).

> **Decision** — one self-referential `locations` tree per warehouse with optional depth, plus a thin
> `warehouses` parent (ADR-004). **Why** — the **same schema** serves a one-room shop (a single zone) and a
> deep DC (zone→aisle→shelf→bin); stock attaches at any node. **Rejected** — separate `zones`/`bins`
> collections (rigid depth, duplicated logic) or stock tracked only at warehouse level (no bin accuracy).

---

## 2. Entities

**Warehouse** extends the shared resource envelope (`id`, `name`, `status`, audit) and behaves like a
party (optional unique `code`; names not unique).

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `name` | `string` | Required, 1–160, trimmed. |
| `code` | `string \| null` | Optional human key (e.g. `WH-MAIN`). **Unique among live rows per tenant** when present. |
| `address` | `Address \| null` | Optional embedded address (shared `Address`, all sub-fields optional). |
| `isDefault` | `boolean` | Default receiving/fulfilment site. **At most one per tenant** (promoting one demotes the previous). |
| `status` | `enum<active, archived>` | Lifecycle. |

**Location** — a node in a warehouse's tree.

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `warehouseId` | `objectId` | → `warehouses`. **Immutable** (a location can't change warehouse). |
| `parentLocationId` | `objectId \| null` | Self-referential; `null` = top-level zone. Must be in the **same warehouse**, acyclic. |
| `path` | `string` | Materialized slash-joined chain of ancestor **codes** (inclusive), e.g. `A/A1/BIN1`. |
| `name` | `string` | Required, 1–160. |
| `code` | `string` | Required. **Unique within its warehouse** (case-insensitive). |
| `type` | `enum<zone, aisle, shelf, bin>` | Granularity; depth optional (no enforced ordering). |
| `status` | `enum<active, archived>` | Lifecycle. |

---

## 3. DTOs

Zod in `packages/types` (`locations.ts`). Requests `.strict()`; responses explicit allow-lists. Server-derived
fields (`path`, audit) never accepted. Warehouse list reuses the shared named-resource query; the location
list adds `warehouseId` / `parentLocationId` / `type` filters and defaults to `path` order.

| DTO | Key fields |
|-----|-----------|
| `CreateWarehouseRequest` | `name`, `code?`, `address?`, `isDefault?` |
| `UpdateWarehouseRequest` | partial of the above (no `status`) |
| `CreateLocationRequest` | `warehouseId`, `name`, `code`, `type (default zone)`, `parentLocationId?` |
| `UpdateLocationRequest` | partial `{ name, code, type, parentLocationId }` (no `warehouseId`) |
| `{Warehouse,Location}Response` | the entity allow-list (location adds `path`) |
| `{...}ListResponse` | `{ data, meta: { page: { page, limit, total, totalPages } } }` |

---

## 4. Validation

1. **Transport (Zod):** types/lengths/enum, code pattern, 24-hex references, `.strict()`.
2. **Domain (service):**
   - warehouse `code` unique among live rows per tenant → 409 `CONFLICT`; single-default invariant.
   - location `code` unique **within its warehouse** → 409; warehouse must be live → 422; parent must
     exist, be in the same warehouse, not self, acyclic → 422; delete refused if **live children** → 409.
3. **Persistence (DB module):** partial unique indexes on `(organizationId, lower(code))` for warehouses
   and `(organizationId, warehouseId, lower(code))` for locations, filtered to live rows.
4. **Output:** explicit mapper. All tenant-scoped; cross-tenant id → not-found.

---

## 5. API

Base `/api/v1`.

| Method | Path | Permission | Success |
|--------|------|-----------|---------|
| GET | `/warehouses` | `warehouse.view` | 200 (list: `q` searches name) |
| POST · GET · PATCH · DELETE | `/warehouses[/:id]` | `warehouse.manage` (read = view) | 201 · 200 · 200 · 204 |
| POST | `/warehouses/:id/{archive,restore}` | `warehouse.manage` | 200 |
| GET | `/locations?warehouseId=…` | `location.view` | 200 (scoped; `q` searches name/code) |
| POST · GET · PATCH · DELETE | `/locations[/:id]` | `location.manage` (read = view) | 201 · 200 · 200 · 204 |
| POST | `/locations/:id/{archive,restore}` | `location.manage` | 200 |

Errors: `VALIDATION_ERROR` 400/422 · `UNAUTHORIZED` 401 · `NOT_FOUND` 404 (incl. cross-tenant) · `CONFLICT`
409 (duplicate code · location-has-children). Every response carries `requestId`. Archive/restore return
**200** (this module sets the `@HttpCode(200)` standard for POST actions).

---

## 6. Permissions

| Permission | Grants | Default system roles |
|-----------|--------|----------------------|
| `warehouse.view` / `location.view` | read + list/search | Owner, Admin, Warehouse Mgr, Operator (read) |
| `warehouse.manage` / `location.manage` | create · update · delete · archive · restore | Owner, Admin, Warehouse Mgr |

> **Action:** sync these four keys into AUTHENTICATION §10 on approval.

---

## 7. Workflow

`active ⇄ archived`, plus soft-delete + restore (restore undeletes → active and re-checks code in the
warehouse). Archiving hides from pickers but keeps the node referenceable. Changing a location's `code` or
`parent` re-materializes its descendants' `path`.

> **Decision** — deleting a location with **live children** is blocked (409); deleting one that holds
> **stock** is not yet. **Why** — the child guard is intra-module and cheap; a stock guard needs the
> Inventory read-model (doesn't exist yet) and would couple locations → inventory. **Follow-up** — stock-in-
> location guard once Inventory lands; auto-promote a new default when the default is deleted.

---

## 8. Architecture

**Warehouse** sits on the shared [`common/resource`](../../apps/api/src/common/resource) base
(`ResourceService<T>` + `InMemoryResourceRepository<T>`) — the same base catalog-lookups and parties use —
extended with a `findDefault` lookup for the single-default invariant. **Location** is **bespoke** (codes are
unique *within a warehouse*, names are not unique, and the node carries a materialized `path`); it composes
the same primitives (id/clock/events from `common/resource`) and reuses the generic not-found / duplicate
errors, but does **not** inherit the name-keyed base — composition over a leaky abstraction. Ports are bound
to in-memory adapters until the DB module; Mongoose adapters drop in unchanged (dependency inversion). The
module **exports `LocationQuery`** so Inventory can validate that stock targets a real, live location.
Frontend: warehouses reuse the generic **`features/resources`** toolkit; locations have a bespoke
warehouse-scoped admin + parent picker. The shared **`Address`** helper (`common/address`) and the web
**address form** (`@/lib/address-form` + `@/components/address-fields`) were promoted from parties this wave.

---

## 9. Testing notes

- **Warehouse (service, fake repos):** create + event; code uniqueness (case-insensitive); names not
  unique; single-default (create + update demote); tenant isolation; archive/restore/soft-delete + restore.
- **Location (service):** root + nested path materialization; unknown warehouse → 422; code unique within
  warehouse but free across warehouses; parent exists/same-warehouse/not-self/no-cycle; descendant path
  recompute on code change; delete refused with children then allowed; archive/restore; tenant isolation;
  warehouse-scoped list ordered by path.
- **Contracts:** strict unknown-field rejection; code/type/country validation; location list defaults + coercion.

---

## 10. Status

🟢 **Implemented** (Wave 3). Sync four permission keys into AUTHENTICATION §10. Follow-ups: stock-in-location
delete guard (needs Inventory); default auto-promotion on delete; Mongoose adapters + materialized-path
indexes (DB module); bulk import of a location tree.
