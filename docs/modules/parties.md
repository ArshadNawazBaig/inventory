# Parties Module (Suppliers · Customers)

| Field | Value |
|-------|-------|
| **Document** | Parties Design (Procurement & Sales reference) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/parties`](../../apps/api/src/modules/parties) · frontend [`apps/web/src/features/parties`](../../apps/web/src/features/parties) |
| **Phase** | Module design + Backend + Frontend (Wave 2) |
| **Depends on** | [catalog-lookups.md](./catalog-lookups.md) (reuses the shared lookup/resource pattern) · DATABASE §5 |
| **Owner** | Backend Lead / Principal Architect |

> The external business **parties** the operational modules transact with: **Suppliers** (whom we buy
> from — referenced by Purchase Orders) and **Customers** (whom we sell to — referenced by Sales Orders).
> Tenant-scoped contact records with CRUD + archive + soft-delete. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary

**Owns:** `suppliers`, `customers`. **Referenced by (later):** Purchasing (`supplierId`), Sales
(`customerId`). Parties do **not** own orders, stock, or pricing — they are addressable contacts.

> **Decision** — model the two as one **party family** behind the same shared generic base used by the
> catalog lookups (`LookupService<T>` / `LookupRepository<T>`). **Why** — both are tenant-scoped, named,
> status'd, soft-deletable contact records sharing ~80% of their shape; the base already exists.
> **Rejected** — two bespoke modules (DRY), or a single `parties` collection with a `type` discriminator
> (loses per-type fields/permissions and the future per-type order references).

---

## 2. Entities

Both extend the shared lookup envelope (standard fields + `name`, `status`); parties add contact fields,
an optional structured **address**, and a few type-specific fields.

**Shared (`PartyEntity`)**

| Field | Type | Notes / invariant |
|-------|------|-------------------|
| `name` | `string` | Required, 1–160, trimmed. |
| `code` | `string \| null` | Optional human key (e.g. `ACME`). **Unique among live rows per tenant per type** when present. |
| `email` / `phone` | `string \| null` | Optional; email format-validated. |
| `website` | `string \| null` | Optional URL. |
| `taxId` | `string \| null` | Optional. |
| `notes` | `string \| null` | Optional, ≤ 2 000. |
| `address` | `Address \| null` | Optional embedded address (all sub-fields optional). |
| `status` | `enum<active, archived>` | Lifecycle (same as lookups). |

**`Address`** — `{ line1, line2, city, region, postalCode, country }`, all `string \| null`; `country`
is an optional ISO-3166 alpha-2 code.

| Type | Extra fields |
|------|--------------|
| **Supplier** | `currency? (ISO-4217)`, `paymentTerms? (≤60)`, `leadTimeDays? (int ≥ 0)` |
| **Customer** | `customerType (individual \| business, default business)`, `creditLimitMinor? (int ≥ 0)`, `currency? (ISO-4217)` |

---

## 3. DTOs

Zod in `packages/types` (`parties.ts`). Requests `.strict()`; responses explicit allow-lists. Server-derived
fields never accepted. The list query reuses the shared named-resource query (`page/limit/sort/status/q`).

| DTO | Key fields |
|-----|-----------|
| `Create{Supplier,Customer}Request` | `name` + contact (`code?,email?,phone?,website?,taxId?,notes?,address?`) + type-specific |
| `Update{...}Request` | partial of the above (no `status`) |
| `{...}Response` | the entity allow-list (`address` flattened to the `Address` object) |
| `{...}ListResponse` | `{ data, meta: { page: { page, limit, total, totalPages } } }` |

---

## 4. Validation

1. **Transport (Zod):** types/lengths/enum, email + URL + ISO-4217 + country format, money/lead-time
   non-negative ints, `.strict()`.
2. **Domain (service):** `code` uniqueness among live rows per tenant per type → 409 `CONFLICT`.
3. **Persistence:** partial unique index on `(organizationId, type, lower(code))` filtered to live rows.
4. **Output:** explicit mapper. All tenant-scoped; cross-tenant id → not-found.

---

## 5. API

Base `/api/v1`. Identical shape per resource (`suppliers` · `customers`):

| Method | Path | Permission | Success |
|--------|------|-----------|---------|
| GET | `/{resource}` | `{type}.view` | 200 (list: `q` searches name/email/code) |
| POST | `/{resource}` | `{type}.manage` | 201 |
| GET | `/{resource}/:id` | `{type}.view` | 200 |
| PATCH | `/{resource}/:id` | `{type}.manage` | 200 |
| DELETE | `/{resource}/:id` | `{type}.manage` | 204 (soft-delete) |
| POST | `/{resource}/:id/archive` | `{type}.manage` | 200 |
| POST | `/{resource}/:id/restore` | `{type}.manage` | 200 |

Errors: `VALIDATION_ERROR` 400 · `UNAUTHORIZED` 401 · `NOT_FOUND` 404 (incl. cross-tenant) · `CONFLICT`
409 (duplicate code). Every response carries `requestId`.

---

## 6. Permissions

Two per resource (deny-by-default, server-enforced; UI mirrors only):

| Permission | Grants | Default system roles |
|-----------|--------|----------------------|
| `supplier.view` / `customer.view` | read + list/search | Owner, Admin, + Purchasing Mgr (suppliers) / Sales (customers) |
| `supplier.manage` / `customer.manage` | create · update · delete · archive · restore | Owner, Admin, Purchasing Mgr (suppliers) / Sales Mgr (customers) |

> **Action:** sync these four keys into AUTHENTICATION §10 on approval.

---

## 7. Workflow

Same lifecycle as lookups: `active ⇄ archived`, plus soft-delete + restore (restore undeletes → active and
re-checks code availability). Archive hides from pickers but keeps the record referenceable in order history.

> **Decision** — deleting a party referenced by orders is **not blocked** in this wave (soft delete only).
> **Why** — a referential guard needs the order read-models (Purchasing/Sales) which don't exist yet, and
> would couple parties → orders. **Follow-up** — usage guard / event cleanup once those modules land.

---

## 8. Architecture

Reuses the catalog-lookups generic base (`LookupService<T>` / `LookupRepository<T>` / in-memory base) —
copied into the parties module as the same pattern (each bounded context owns its adapters per
module-boundaries). Concrete `SupplierService` / `CustomerService` add their extra fields; the base
provides CRUD + code uniqueness + soft-delete/restore. Frontend reuses the shared **`features/resources`**
toolkit (`ResourceManager`, `ResourceSelect`, generic api/query/mutation hooks). No `CatalogLookupQuery`-style
export yet — Purchasing/Sales will add a `PartyQuery` port when they need to validate `supplierId`/`customerId`.

---

## 9. Testing notes

- **Unit (services, fake repos):** create happy path; duplicate code → 409; tenant isolation; archive /
  restore / soft-delete + restore-frees-code; customer default `customerType`; address round-trip.
- **Contracts:** strict unknown-field rejection; email/URL/currency/country validation; list coercion.

---

## 10. Status

🟢 **Implemented** (Wave 2). Sync four permission keys into AUTHENTICATION §10. Follow-ups: referential
guard on delete (needs order read-models); multiple addresses + contacts; Mongoose adapters (DB module);
`PartyQuery` export for Purchasing/Sales.
