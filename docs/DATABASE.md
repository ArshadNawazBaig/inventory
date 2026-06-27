# Database Design

| Field | Value |
|-------|-------|
| **Document** | Database Design (MongoDB / Mongoose) |
| **Status** | 🔵 In review — authored, awaiting approval |
| **Phase** | 5 — Database |
| **Depends on** | [ARCHITECTURE.md](./ARCHITECTURE.md) · [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) |
| **Authoritative sources** | [`.claude/database/*`](../.claude/database) (collections · indexes · relationships · transactions · multi-tenancy · audit-logs · naming) |
| **Owner** | Database Architect |

> This is the canonical data-model specification for **StockFlow**. It is **design only** — no Mongoose
> schemas, no migrations, no code. It defines every collection, its fields, how collections relate, every
> index and the query it serves, transaction boundaries, tenant-isolation enforcement, the audit trail,
> and soft-delete conventions — and **explains why** each choice was made. It deepens §9 of
> [ARCHITECTURE.md](./ARCHITECTURE.md) into an implementable spec.

---

## 0. Reading guide

- Decision blocks follow the same format as the architecture doc: **Decision → Why → Rejected**.
- Types are conceptual (`ObjectId`, `string`, `int`, `Date`, `enum<...>`, `Money`, `Qty`) — not Mongoose
  types. The Zod schemas in `packages/types` are the eventual single source of truth (Phase 6/7).
- `Money` = integer **minor units** + a sibling `currency` (ISO-4217). `Qty` = integer in the variant's
  base unit (decimal handling in [§11.3](#113-quantity--money-precision)).
- Conventions (naming, standard fields) are defined once in [§1](#1-conventions--standard-document-shape)
  and assumed everywhere after.

---

## 1. Conventions & standard document shape

### 1.1 Naming (from [naming.md](../.claude/database/naming.md))

| Element | Rule | Example |
|---------|------|---------|
| Collections | plural, `snake_case` | `stock_movements`, `purchase_orders` |
| Fields | `camelCase` | `reorderPoint`, `expectedAt` |
| Foreign keys | `<entity>Id` → `<entities>._id` | `variantId` → `variants` |
| Booleans | `is` / `has` / `can` prefix | `isArchived`, `hasVariants` |
| Timestamps | `At` suffix, **UTC** | `createdAt`, `receivedAt` |
| Money | integer minor units + `currency` | `unitCostMinor: 4999`, `currency: "USD"` |
| Enums | lowercase string constants, defined once in `packages/types` | `status: "draft"` |

No non-canonical abbreviations (`qty` ok, `wh` not); never a bare `order` (use `purchaseOrder` /
`salesOrder`).

### 1.2 Standard fields on **every** domain document

| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | Primary key. |
| `organizationId` | `ObjectId` | **Required, immutable** tenant key. Leads every compound index. *(Exceptions in [§10.2](#102-the-two-deliberate-exceptions).)* |
| `createdAt` | `Date` | Set on insert, immutable. |
| `updatedAt` | `Date` | Touched on every update. |
| `deletedAt` | `Date \| null` | **Soft-delete tombstone** — `null` means live ([§12](#12-soft-deletes)). |
| `createdBy` | `ObjectId \| null` | Actor (user) or `null` for system. |
| `updatedBy` | `ObjectId \| null` | Last mutating actor. |
| `schemaVersion` | `int` | Document schema version for online migrations ([§13.2](#132-schema-versioning--migrations)). |

> **Decision** — a fixed envelope on every document.
> **Why** — tenant scoping, auditability, soft delete, and migration are cross-cutting; making them
> structural (always present, always named the same) means tooling — the base repository, the soft-delete
> filter, the migration runner — can rely on them universally instead of per-collection special-casing.

> **Immutable collections** (`stock_movements`, `audit_logs`) are **append-only**: they carry `_id`,
> `organizationId`, `createdAt`, `createdBy` but **no** `updatedAt`/`deletedAt` — they are never updated or
> deleted by design ([§12.4](#124-what-is-never-soft-deleted)).

---

## 2. Collection map (bounded contexts)

24 collections, grouped by the module that owns them ([ARCHITECTURE.md §6](./ARCHITECTURE.md)). A module
writes only its own collections; cross-context reads go through the owning service.

```
IDENTITY & ACCESS   organizations · users* · memberships · roles · permissions*
CATALOG             products · variants · categories · brands · units
LOCATIONS           warehouses · locations
INVENTORY           stock_levels · stock_movements(ledger) · reservations · transfers · counts
PROCUREMENT         suppliers · purchase_orders
SALES               sales_orders
PLATFORM            audit_logs · notifications · subscriptions · files
                    (* = NOT org-scoped — see §10.2)
```

> Better Auth manages its own auth/session storage (sessions, accounts, verification tokens). Those are
> **not** part of this domain schema; `users` below is the domain-facing profile projection keyed to the
> Better Auth user id.

---

## 3. Identity & Access

### 3.1 `organizations` — the tenant root
| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | This **is** the `organizationId` every other collection references. |
| `name` | `string` | Display name. |
| `slug` | `string` | URL-safe, **globally unique**. |
| `ownerId` | `ObjectId` | → `users`. Exactly one owner; transfer is an explicit, audited action. |
| `settings` | `object` | Tenant policy: `allowNegativeStock` (bool), `defaultCurrency`, `valuationMethod` (enum, [§22](#22-open-decisions)), `timezone`, `auditRetentionDays`. |
| `status` | `enum<active, suspended, cancelled>` | Billing/lifecycle state. |
| standard fields | | `organizationId` here equals `_id`. |

### 3.2 `users` — global identity *(not org-scoped)*
| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | Matches the Better Auth user id. |
| `email` | `string` | **Globally unique** (citext/lowercased). |
| `name`, `avatarFileId` | `string`, `ObjectId\|null` | Profile; avatar → `files`. |
| `status` | `enum<active, disabled>` | Platform-level. |
| standard fields | | **No `organizationId`** — see [§10.2](#102-the-two-deliberate-exceptions). |

### 3.3 `memberships` — user ↔ organization (the tenant join)
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `userId` | `ObjectId` | → `users`. |
| `roleIds` | `ObjectId[]` | → `roles`. Effective permissions = union of these roles. |
| `warehouseScopeIds` | `ObjectId[] \| null` | If set, operator is scoped to these warehouses ([RBAC](../.claude/security/rbac.md)). |
| `status` | `enum<invited, active, suspended>` | Invitation flow. |
| `invitedBy`, `invitedAt`, `acceptedAt` | refs / `Date` | Audit of onboarding. |

> **Decision** — a separate `memberships` collection instead of an array of orgs on `users`.
> **Why** — a user can belong to many orgs with different roles; modeling the join explicitly keeps it
> tenant-scoped (it carries `organizationId`, so the base repository isolates it like everything else),
> queryable ("all members of org X"), and unbounded-safe. **Rejected** — embedding memberships in the
> global `users` document (unbounded array, breaks tenant scoping, hot-document contention).

### 3.4 `roles` — permission bundles
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Custom roles are tenant-owned. |
| `key` | `string` | Stable identifier (e.g. `inventory_manager`). |
| `name`, `description` | `string` | Display. |
| `isSystem` | `bool` | System roles are seeded and immutable per tenant; custom roles editable (Growth+). |
| `permissionKeys` | `string[]` | Atomic permission keys (e.g. `stock.adjust`) — **stored by key**, not by ObjectId ref. |

> **Decision** — roles store permission **keys** (strings), not references to `permissions` documents.
> **Why** — the permission catalog is a fixed code-defined constant set ([§3.5](#35-permissions--global-catalog-not-org-scoped)); keys are stable, human-readable, and let an authorization
> check evaluate `requiredKey ∈ union(role.permissionKeys)` with no extra lookup/join. **Rejected** —
> ObjectId references (needless join on every authz check; keys are the real identity anyway).

### 3.5 `permissions` — global catalog *(not org-scoped)*
| Field | Type | Notes |
|-------|------|-------|
| `key` | `string` | `<resource>.<action>` — **globally unique**, the canonical identity. |
| `resource`, `action` | `string` | For grouping in the role editor UI. |
| `description` | `string` | Human description. |

Seeded constant set (e.g. `product.create`, `stock.adjust`, `po.approve`, `audit.export`). See
[permissions.md](../.claude/security/permissions.md).

---

## 4. Catalog

### 4.1 `products` — catalog parent
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `name`, `description` | `string` | |
| `categoryId`, `brandId`, `baseUnitId` | `ObjectId` (ref) | → taxonomy collections. |
| `attributes` | `object` | Tenant-defined custom attributes (schema-flexible). |
| `imageFileIds` | `ObjectId[]` | → `files` (bounded gallery). |
| `hasVariants` | `bool` | A product always has ≥1 variant (a "simple" product = one default variant). |
| `status` | `enum<draft, active, archived>` | Lifecycle (distinct from soft delete — see [§12.3](#123-archive-vs-delete)). `draft` = created/imported but not yet published. |

### 4.2 `variants` — the sellable / stockable unit
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `productId` | `ObjectId` | → `products`. |
| `sku` | `string` | **Unique per tenant** ([§9.2](#92-uniqueness-indexes)). |
| `barcode` | `string \| null` | UPC/EAN; unique per tenant when present. |
| `attributes` | `object` | Variant axes (e.g. `{ color: "red", size: "M" }`). |
| `unitId` | `ObjectId` | Stock-keeping unit of measure. |
| `reorderPoint`, `reorderQty` | `Qty` | Low-stock thresholds (drive alerts). |
| `defaultPriceMinor`, `currency` | `Money` | List price (sales pricing detail deferred). |
| `status` | `enum<active, archived>` | |

> **Decision** — stock attaches to the **variant**, never the product (ADR-003). On-hand never lives on
> the catalog document.
> **Why** — quantities change constantly and per-location; the catalog changes rarely. Keeping them in
> separate collections (`stock_levels` / `stock_movements`) avoids hot-document contention on the catalog
> and lets the ledger be append-only. **Rejected** — an `onHand` field on `variants` (write contention,
> no per-location breakdown, and it would make on-hand mutable-in-place, violating I3/I4).

### 4.3 `categories` · `brands` · `units` — taxonomy
Each: `organizationId`, `name`, plus —
- `categories`: `parentCategoryId` (self-referential tree), `path` (materialized ancestor path for subtree
  queries).
- `brands`: `name` only (+ optional `logoFileId`).
- `units`: `name`, `code` (e.g. `ea`, `kg`), `precision` (decimal places, [§11.3](#113-quantity--money-precision)).

> **Decision** — taxonomy as **referenced** collections, not strings embedded on products.
> **Why** — rename a brand once, not across a million products; enables faceted filtering and integrity.
> Categories use a **materialized `path`** so "everything under Electronics" is a single indexed prefix
> query rather than a recursive graph traversal. **Rejected** — embedded category strings (rename storms,
> no hierarchy), or pure adjacency-list with runtime recursion (slow subtree reads).

---

## 5. Locations (ADR-004)

### 5.1 `warehouses`
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `name`, `code` | `string` | `code` unique per tenant. |
| `address` | `object` | Postal address. |
| `isDefault` | `bool` | Default receiving/fulfilment site. |

### 5.2 `locations` — hierarchical zones/bins
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `warehouseId` | `ObjectId` | → `warehouses`. |
| `parentLocationId` | `ObjectId \| null` | Self-referential hierarchy (Zone → Bin). `null` = top zone. |
| `path` | `string` | Materialized ancestor path for subtree roll-ups. |
| `type` | `enum<zone, aisle, shelf, bin>` | Granularity; bins optional. |
| `code` | `string` | Unique within a warehouse. |

> **Decision** — Warehouse → Zone → Bin as one self-referential `locations` tree with optional depth
> (ADR-004).
> **Why** — the **same schema** serves a one-room shop (a single default location) and an enterprise DC
> (deep bin hierarchy). Stock is tracked at `locationId`; roll-ups use the materialized `path`. **Rejected**
> — separate `zones`/`bins` collections (rigid depth, duplicated logic), or stock tracked only at warehouse
> level (no bin-level accuracy for large operations).

---

## 6. Inventory — the keystone

### 6.1 `stock_movements` — the immutable ledger (source of truth, ADR-002)
**Append-only. Never updated, never deleted.**

| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | |
| `organizationId` | `ObjectId` | Tenant. |
| `variantId` | `ObjectId` | → `variants`. |
| `locationId` | `ObjectId` | → `locations`. |
| `delta` | `int` (signed `Qty`) | The quantity change. **The only thing that moves on-hand.** |
| `type` | `enum<receipt, shipment, adjustment, transfer_out, transfer_in, count_adjustment, return_in, return_out, scrap>` | Reason class. |
| `reason` | `object` | Source ref: `{ kind: enum<purchase_order, sales_order, transfer, count, manual>, refId, lineId? }`. |
| `unitCostMinor`, `currency` | `Money \| null` | Inbound cost (drives weighted-average valuation). |
| `opKey` | `string` | **Idempotency key** — unique per tenant ([§9.2](#92-uniqueness-indexes), [§11](#11-transactions)). |
| `note` | `string \| null` | Optional human reason. |
| `createdAt`, `createdBy` | `Date`, `ObjectId` | When/who. **No `updatedAt`/`deletedAt`.** |

### 6.2 `stock_levels` — the on-hand projection (reconcilable)
**One document per (variant × location).** Derived from the ledger; never authored by hand.

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `variantId`, `locationId` | `ObjectId` | Composite business key. |
| `onHand` | `Qty` | `≡ Σ(stock_movements.delta)` for this (variant, location). |
| `reserved` | `Qty` | `≡ Σ(active reservations.quantity)`. |
| `available` | `Qty` (derived) | `onHand − reserved`; **persisted** for indexable low-stock queries, recomputed in the same transaction. |
| `inTransit` | `Qty` | Incoming via open transfers (informational; [§6.4](#64-transfers)). |
| `avgCostMinor`, `currency` | `Money` | Weighted-average cost, recomputed on each `receipt` in-transaction. |
| `lastMovementAt` | `Date` | For staleness/reporting. |

> **Decision** — on-hand is a **persisted projection** recomputed inside the same transaction as the
> ledger write, **and** independently reconstructable by summing the ledger.
> **Why** — reads (dashboards, ATP checks) must be O(1), not "sum a million movements" — so we persist the
> projection. But the projection is a cache of a derivable truth, so a reconciliation job can rebuild and
> verify it (`onHand == Σ delta`) and catch any drift. Best of both: fast reads, provable correctness
> ([§11.4](#114-reconciliation)). **Rejected** — computing on-hand live from the ledger on every read
> (unscalable), or storing on-hand with no ledger to verify against (unauditable — the failure mode we
> exist to prevent).

> **Decision** — `available` is persisted, not purely computed at read time.
> **Why** — "show me everything below reorder point" must be an **indexed** query across 100k variants;
> that needs `available` (or `available − reorderPoint`) on disk. It is only ever written inside the
> reservation/movement transaction, so it can't drift from `onHand − reserved`.

### 6.3 `reservations` — soft holds (allocated/ATP)
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `variantId`, `locationId` | `ObjectId` | What/where is held. |
| `quantity` | `Qty` | Held amount. |
| `status` | `enum<active, released, fulfilled, expired>` | Lifecycle. |
| `source` | `object` | `{ kind: sales_order, refId, lineId }`. |
| `expiresAt` | `Date \| null` | Optional TTL for soft holds. |

> **Decision** — reservations are a **separate collection**, not ledger movements; they reduce `available`
> (via `reserved`) but never `onHand`.
> **Why** — a reservation is a *promise*, not a *physical movement*. Physical stock hasn't left; only
> availability-to-promise drops. Conflating the two would corrupt the meaning of the ledger (on-hand would
> fall for goods still on the shelf). Shipping a reservation is what posts the actual `shipment` movement.

### 6.4 `transfers` — inter-location moves
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `fromLocationId`, `toLocationId` | `ObjectId` | Endpoints. |
| `lines` | `embedded[]` | `{ variantId, quantity, shippedQty, receivedQty }`. |
| `status` | `enum<draft, in_transit, partially_received, received, cancelled>` | Lifecycle. |
| `shippedAt`, `receivedAt` | `Date` | |

A dispatch posts `transfer_out` movements at the source (and tracks `inTransit` at the destination); a
receipt posts `transfer_in` movements at the destination. The two legs are linked by the transfer's `_id`
in each movement's `reason`.

> **Decision** — model in-transit explicitly via the open transfer (+ a destination `inTransit` counter),
> rather than a "limbo" location.
> **Why** — keeps the location tree clean and makes "what's coming to this warehouse" a direct query on
> open transfers. Each leg is still a real, auditable ledger movement, so the invariant `onHand == Σ delta`
> holds at both source and destination throughout. **Rejected** — a synthetic in-transit pseudo-location
> (pollutes the location hierarchy and reporting).

### 6.5 `counts` — cycle / physical counts
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `warehouseId` | `ObjectId` | Scope of the count. |
| `lines` | `embedded[]` | `{ variantId, locationId, systemQty, countedQty, varianceQty }`. |
| `status` | `enum<draft, in_progress, pending_approval, approved, cancelled>` | |
| `approvedBy`, `approvedAt` | ref / `Date` | |

On **approval**, each non-zero variance posts a `count_adjustment` movement (signed by the variance),
reconciling the ledger to the counted reality — inside a transaction.

---

## 7. Procurement

### 7.1 `suppliers`
`organizationId`, `name`, `code` (unique per tenant), `contact` (object), `defaultCurrency`, `status<active,
archived>`, `leadTimeDays`.

### 7.2 `purchase_orders` — inbound
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `poNumber` | `string` | Human ref, **unique per tenant** (sequence, [§13.3](#133-human-readable-sequences)). |
| `supplierId` | `ObjectId` | → `suppliers`. |
| `warehouseId` | `ObjectId` | Receiving site. |
| `lines` | `embedded[]` | `{ variantId, skuSnapshot, nameSnapshot, orderedQty, receivedQty, unitCostMinor, currency }`. |
| `status` | `enum<draft, submitted, approved, partially_received, received, closed, cancelled>` | Lifecycle. |
| `expectedAt`, `approvedBy`, `receivedAt` | `Date` / ref | |
| `totalsMinor` | `object` | Denormalized subtotal/tax/total for list display. |

> **Decision** — PO/SO line items are **embedded**; they carry **snapshots** of `sku`/name/price at
> order time.
> **Why** — lines are owned by and bounded to their order and always read with it — the textbook embed
> case. Snapshotting catalog values preserves **historical accuracy**: renaming a product later must not
> rewrite history on a closed PO. **Rejected** — lines as a separate collection (needless joins for a
> bounded, owned set), or referencing live catalog values (history silently mutates).

---

## 8. Sales

### 8.1 `sales_orders` — outbound
| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant. |
| `soNumber` | `string` | Unique per tenant (sequence). |
| `customer` | `object` | Customer snapshot (full CRM deferred). |
| `warehouseId` | `ObjectId` | Fulfilment site. |
| `lines` | `embedded[]` | `{ variantId, skuSnapshot, nameSnapshot, orderedQty, allocatedQty, shippedQty, unitPriceMinor, currency }`. |
| `status` | `enum<draft, confirmed, allocated, partially_shipped, shipped, completed, cancelled>` | Lifecycle. |
| `reservationIds` | `ObjectId[]` | Active holds backing this order. |
| `shippedAt`, `totalsMinor` | `Date` / object | |

Confirming an SO creates `reservations` (reducing `available`); shipping releases the reservation and
posts a `shipment` movement (reducing `onHand`) — transactionally.

---

## 9. Indexes

> **Principle** ([indexes.md](../.claude/database/indexes.md)) — no index without a documented query; no
> hot query without an index. Compound indexes **lead with `organizationId`** (tenant scope is in every
> query); field order follows **ESR** (Equality → Sort → Range); verified with `explain()` targeting
> `IXSCAN`.

### 9.1 Read / filter indexes (per collection)

| Collection | Index (keys) | Serves | Selectivity / cost note |
|------------|--------------|--------|--------------------------|
| `memberships` | `{ organizationId, userId }` | members of an org / a user's role in an org | high; small collection |
| `memberships` | `{ userId }` | "which orgs do I belong to?" (login) | global lookup by user |
| `variants` | `{ organizationId, productId }` | list a product's variants | medium |
| `variants` | `{ organizationId, status, available }`¹ | low-stock / active browsing | supports range on `available` |
| `products` | `{ organizationId, categoryId, status }` | catalog browse by category | medium |
| `stock_levels` | `{ organizationId, variantId, locationId }` **unique** | on-hand lookup (hottest read) | 1 doc; the ATP/read hot path |
| `stock_levels` | `{ organizationId, locationId, available }` | low-stock per location, reorder reports | range on `available` |
| `stock_movements` | `{ organizationId, variantId, locationId, createdAt }` | movement history / reconciliation | high write volume — see §9.3 |
| `stock_movements` | `{ organizationId, createdAt }` | tenant-wide ledger scans (reports/export) | large scans → async jobs |
| `reservations` | `{ organizationId, variantId, locationId, status }` | active-reservation sum for ATP | filter `status=active` |
| `transfers` | `{ organizationId, status, toLocationId }` | incoming/in-transit per warehouse | medium |
| `purchase_orders` | `{ organizationId, status, expectedAt }` | PO worklists / filters | ESR: eq status, range expectedAt |
| `sales_orders` | `{ organizationId, status, createdAt }` | SO worklists / filters | ESR pattern |
| `counts` | `{ organizationId, status, warehouseId }` | open counts per warehouse | small |
| `notifications` | `{ organizationId, userId, dismissedAt, createdAt }` | unread badge + center list | partial on `dismissedAt: null` |
| `audit_logs` | `{ organizationId, entityType, entityId, createdAt }` | entity audit trail | append-only |
| `audit_logs` | `{ organizationId, actorId, createdAt }` | actor audit filter | append-only |
| `files` | `{ organizationId, entityType, entityId }` | assets for an entity | medium |

¹ `available` can be indexed directly, or a derived `belowReorder` boolean can be maintained for an even
cheaper equality index — decided at implementation against real query shapes.

### 9.2 Uniqueness indexes (per-tenant)

| Collection | Unique key | Enforces |
|------------|-----------|----------|
| `organizations` | `{ slug }` | global org slug |
| `users` | `{ email }` | global identity |
| `permissions` | `{ key }` | global catalog key |
| `variants` | `{ organizationId, sku }` **partial: `deletedAt: null`** | SKU unique **per live variant per tenant** |
| `variants` | `{ organizationId, barcode }` partial: `barcode != null, deletedAt: null` | barcode unique when present |
| `roles` | `{ organizationId, key }` | role key per tenant |
| `warehouses` | `{ organizationId, code }` | warehouse code per tenant |
| `locations` | `{ organizationId, warehouseId, code }` | location code per warehouse |
| `stock_levels` | `{ organizationId, variantId, locationId }` | one projection per cell |
| `stock_movements` | `{ organizationId, opKey }` | **idempotency** — a retried op can't double-post |
| `purchase_orders` / `sales_orders` | `{ organizationId, poNumber }` / `{ organizationId, soNumber }` | human refs per tenant |

> **Decision** — per-tenant uniqueness is a **partial unique compound index keyed on `deletedAt: null`**
> (e.g. `{ organizationId, sku }` where `deletedAt: null`).
> **Why** — a plain unique index would let a **soft-deleted** SKU permanently squat its value, so the
> tenant could never reuse "WIDGET-01" after deleting it — surprising and wrong. Scoping uniqueness to live
> documents lets deleted keys be reused while still preventing duplicate **active** SKUs. This is the
> critical interaction between soft delete and uniqueness ([§12.2](#122-soft-delete--unique-indexes)).
> **Rejected** — plain unique index (dead keys block reuse), or app-level uniqueness checks (racy, not
> atomic).

> **Decision** — `{ organizationId, opKey }` unique on the ledger is the **idempotency backbone**.
> **Why** — at-least-once delivery (retries, queue redelivery, double-clicks) means the same logical stock
> operation may be attempted twice. A unique `opKey` makes the second insert fail atomically, so the ledger
> can never double-post — idempotency enforced by the database, not by hope ([§11.2](#112-idempotency)).

### 9.3 Write-cost & TTL notes

- `stock_movements` and `audit_logs` are **write-heavy, append-only**; we keep their index set **minimal**
  (only the access patterns above). Every extra index taxes every insert on the hottest write paths.
- **TTL indexes** are used only for genuinely ephemeral data — e.g. expired `reservations`
  (`expiresAt`) and (optionally) old `notifications`. Domain data is **never** TTL-deleted (that would be
  silent data loss); it is archived deliberately ([§13.1](#131-retention--archival)).

---

## 10. Multi-tenancy (ADR-001)

### 10.1 Enforcement
- **Every domain collection** carries a required, immutable `organizationId`; **every** query and write is
  scoped by it — enforced **centrally** in the base tenant repository / Mongoose plugin, never per call
  site (a developer cannot forget what they don't write).
- `organizationId` is taken from the **server-derived AuthContext** (session), **never** from the request
  body/query — the client cannot choose its tenant ([ARCHITECTURE.md §13](./ARCHITECTURE.md)).
- Compound indexes lead with `organizationId`; uniqueness is per-tenant.
- A query that reaches the driver without tenant scope **throws** in dev/test (fail-fast guardrail).

### 10.2 The two deliberate exceptions
`users` and `permissions` are **global, not org-scoped**:
- `users` — a person is one global identity (one email) that can join multiple organizations; tenancy is
  expressed by `memberships`, which **is** org-scoped. A user reading another user's profile is gated by
  shared membership at the service layer.
- `permissions` — a fixed, code-defined catalog identical for all tenants.

> **Decision** — call these exceptions out explicitly rather than bending them into the org-scoped rule.
> **Why** — forcing a global `users` document to carry one `organizationId` would break multi-org users and
> duplicate accounts per tenant. Naming the exceptions (and routing all tenant logic through `memberships`)
> keeps the "everything is org-scoped" rule honest for the other 22 collections, where it must be absolute.

### 10.3 Testing (mandatory)
Adversarial cross-tenant tests for **every** endpoint: a user in org A must never read/update/delete org
B's data via any endpoint, filter, ID guess, bulk op, export, or aggregation. Cross-tenant access returns
**404** (no existence leak). See [tenant-isolation.md](../.claude/security/tenant-isolation.md).

---

## 11. Transactions

> MongoDB multi-document transactions (replica set) guarantee stock integrity. A transaction is
> **mandatory** whenever an operation writes a ledger entry **and** updates a projection or related
> document ([transactions.md](../.claude/database/transactions.md)).

### 11.1 Transaction boundaries

| Operation | Atomic writes inside one transaction |
|-----------|--------------------------------------|
| **Adjustment** | `stock_movements`(adjustment) + `stock_levels`(onHand, available) |
| **Receive against PO** | `stock_movements`(receipt) + `stock_levels`(onHand, avgCost, available) + `purchase_orders`(receivedQty, status) |
| **Transfer dispatch** | `stock_movements`(transfer_out) + source `stock_levels` + dest `inTransit` + `transfers`(status) |
| **Transfer receipt** | `stock_movements`(transfer_in) + dest `stock_levels` + `transfers`(receivedQty, status) |
| **Reserve / release** | `reservations`(create/close) + `stock_levels`(reserved, available) |
| **Ship / fulfil** | `stock_movements`(shipment) + `stock_levels`(onHand, available) + `reservations`(fulfilled) + `sales_orders`(shippedQty, status) |
| **Count approval** | per variance: `stock_movements`(count_adjustment) + `stock_levels` + `counts`(status) |

### 11.2 Idempotency
Every transactional operation carries an **`opKey`** persisted on the ledger entry under the unique
`{ organizationId, opKey }` index. A retried request re-uses the same `opKey`; the duplicate insert fails
atomically → the operation is recognized as already applied and the transaction is a safe no-op. This makes
at-least-once delivery (queue redelivery, network retries, double-submits) safe by construction.

### 11.3 Quantity & money precision
- **Money** is always integer **minor units** + `currency` — never floats (no rounding drift on valuation).
- **Quantity** is integer in the variant's base unit. Fractional units (e.g. 1.25 kg) are handled by the
  unit's `precision`: quantities are stored as integers in the smallest unit (grams) and presented scaled.
  No floating-point quantities are ever persisted.

### 11.4 Rules & reconciliation
- Read the current `stock_level` **in the session**; assert invariants **before commit**:
  `available = onHand − reserved ≥ 0` (unless the tenant's `allowNegativeStock` is on); `onHand ≥ 0`.
- **No external I/O** (email, Cloudinary, webhooks) inside a transaction — emit a domain event after commit
  and let the worker do it (keeps transactions short, avoids holding locks on third-party latency).
- Retry `TransientTransactionError` / `WriteConflict` with bounded exponential backoff.
- **Reconciliation job** (async, periodic): for sampled or all (variant, location) cells, assert
  `stock_levels.onHand == Σ(stock_movements.delta)` and `reserved == Σ(active reservations)`. Drift →
  alert + rebuild the projection from the ledger (the ledger always wins). This is the safety net that
  makes a persisted projection trustworthy.

---

## 12. Soft deletes

### 12.1 The convention
- Every mutable domain document has `deletedAt: Date | null`. **Live = `null`.** "Deleting" sets the
  timestamp (and `updatedBy`); it never removes the row.
- The **base repository excludes `deletedAt != null` by default** on every read — soft-deleted docs are
  invisible unless a query explicitly opts in (`withDeleted`).

> **Decision** — soft delete by default across mutable domain data.
> **Why** — destructive deletes are irreversible and break referential history (an audit entry or closed
> order pointing at a vanished variant). Soft delete preserves the trail, enables restore, and lets us audit
> *who* deleted *what* and *when* — directly serving "stock accuracy is the product" and the immutable-audit
> mandate. **Rejected** — hard deletes (data loss, dangling references, unauditable).

### 12.2 Soft delete × unique indexes
Per-tenant unique indexes are **partial**, keyed on `deletedAt: null` (see [§9.2](#92-uniqueness-indexes)),
so a deleted SKU/code can be reused while duplicate **live** values remain impossible. This is the single
most important soft-delete subtlety and is non-optional.

### 12.3 Archive vs delete
`status: active | archived` (on catalog/supplier docs) is **distinct** from `deletedAt`:
- **Archive** = "no longer used, but kept and referenceable" (hidden from pickers, still in reports).
- **Soft delete** = "removed" (hidden everywhere by default, restorable by an admin).

> **Decision** — keep `archived` and `deletedAt` as separate concepts.
> **Why** — they answer different questions ("is this still offered?" vs "was this removed?"). Collapsing
> them loses the ability to retire a product from selection without erasing it from the working set.

### 12.4 What is **never** soft-deleted
`stock_movements` and `audit_logs` are **append-only and immutable** — they have no `deletedAt`. You cannot
delete history; you **correct** it with a compensating entry (e.g. a reversing `adjustment` movement). This
preserves the property that the ledger is a complete, tamper-evident record.

### 12.5 Restore & purge
- **Restore** clears `deletedAt` (subject to the partial-unique constraint — a restore fails if the key was
  reused; surfaced as a conflict).
- **Hard purge** (GDPR/compliance erasure, or after a retention window) is a **separate, audited,
  permission-gated, async** operation — never the default delete path, and it records the purge in
  `audit_logs`.

---

## 13. Retention, versioning, sequences, migration

### 13.1 Retention & archival
- **Ledger growth** is the long-term scaling concern. Old `stock_movements` are **rolled up/archived**
  (e.g. monthly opening-balance snapshots per cell + cold-storage of pre-snapshot movements), so the hot
  ledger stays bounded while history is preserved. The projection (`stock_levels`) is always the read path,
  so archival never affects on-hand reads.
- **Audit retention** is per-tenant configurable (`organizations.settings.auditRetentionDays`), defaulting
  to ≥ the legal minimum; expired audit beyond policy is archived, not silently dropped.

### 13.2 Schema versioning & migrations
- Every document carries `schemaVersion`. Migrations are **online and incremental** (lazy "migrate on
  read/write" and/or a background backfill job), never a big-bang downtime migration.
- Backward-compatible field additions don't bump major; destructive shape changes are versioned and
  migrated explicitly.

### 13.3 Human-readable sequences
`poNumber` / `soNumber` / count numbers are generated by a **per-tenant atomic counter** (a `counters`
helper document incremented with `findOneAndUpdate`), guaranteeing gapless-ish, unique, per-tenant
sequences without races. (The unique index is the final guard.)

---

## 14. Relationship overview (ER summary)

```
organizations 1─* memberships *─1 users           organizations 1─* roles *─(keys)─ permissions(global)
products 1─* variants                              categories/brands/units 1─* products  (reference)
warehouses 1─* locations (self-tree via parentLocationId, materialized path)
variant ×location 1─1 stock_levels (projection)    variant ×location 1─* stock_movements (immutable ledger)
purchase_orders 1─* POLine (embedded, snapshots) ──receive──▶ stock_movements(receipt)
sales_orders    1─* SOLine (embedded, snapshots) ──reserve──▶ reservations ──ship──▶ stock_movements(shipment)
transfers 1─2 stock_movements (transfer_out + transfer_in)
counts    1─* CountLine ──approve──▶ stock_movements(count_adjustment)
* mutations ──emit event──▶ audit_logs (immutable) + notifications
files ◀─ imageFileIds/avatarFileId (catalog, users, ...)        subscriptions 1─1 organizations (Stripe)
```

Embed vs reference rule ([relationships.md](../.claude/database/relationships.md)): **embed** when owned,
bounded, always-read-together (order lines); **reference** when shared, unbounded, or independently queried
(product↔variants, ledger, audit). Never embed unbounded growth.

---

## 15. Audit logs

`audit_logs` is the tamper-evident record of who did what, when, to which entity — **append-only,
immutable** ([audit-logs.md](../.claude/database/audit-logs.md), [security/audit.md](../.claude/security/audit.md)).

| Field | Type | Notes |
|-------|------|-------|
| `organizationId` | `ObjectId` | Tenant (audit is tenant-scoped; readable with `audit.view`). |
| `actorId`, `actorType` | `ObjectId` / `enum<user, system, api_key>` | Who acted. |
| `action` | `string` | e.g. `purchase_order.received`, `role.updated`, `member.removed`. |
| `entityType`, `entityId` | `string`, `ObjectId` | What was acted on. |
| `before`, `after` | `object \| null` | Redacted diff snapshots (secrets/PII stripped). |
| `metadata` | `object` | `{ ip, userAgent, requestId }` for correlation with logs/Sentry. |
| `createdAt`, `createdBy` | `Date`, `ObjectId` | **No `updatedAt`/`deletedAt`.** |

**Rules:** written server-side close to the mutation (same transaction or a guaranteed post-commit event)
so it cannot be skipped; **secrets/PII redacted** from `before`/`after`; large payloads referenced, never
embedded; **exported via async job**, never a synchronous endpoint; retention per-tenant.

> **Decision** — stock movements are themselves audit-grade, so `audit_logs` covers **everything else**
> (config, permissions/roles, memberships, orders' state changes, exports, security denials) — not stock
> quantity changes (the ledger already is that record).
> **Why** — avoids double-writing the highest-volume events while still giving a complete trail for
> security/config actions. Together, the **ledger + audit log** mean every number and every privileged
> action is explainable — the foundation of SOC-2 readiness and incident response.

---

## 16. What to read next

This spec feeds **Phase 6 — [API_SPEC.md](./API_SPEC.md)** (endpoints, DTOs, pagination/filter contracts
over these collections) and **Phase 7 — Backend** (the Zod schemas in `packages/types` become the typed
realization of every shape above). No schema is implemented until this document and the API spec are
approved.

---

## 22. Open decisions (require ratification)

| Topic | Proposed default | Impact on schema |
|-------|------------------|------------------|
| Valuation method | Weighted-average | `stock_levels.avgCostMinor`; FIFO/LIFO would need cost layers (a `cost_lots` collection) |
| Negative stock | Off by default, per-tenant `allowNegativeStock` | invariant assertion in transactions |
| Reservation expiry | Optional TTL on soft holds | `reservations.expiresAt` + TTL index |
| Ledger archival cadence | Monthly opening-balance snapshots | `inventory_snapshots` rollup collection (Phase 7) |
| Full CRM / customers | Snapshot on SO for v1; promote to `customers` later | `sales_orders.customer` embed → reference |

---

## 23. Status

🔵 **In review.** On approval this becomes the authoritative data model and unblocks the API spec
(Phase 6). Every index, transaction boundary, and tenancy/soft-delete/audit rule here is binding on the
backend implementation (Phase 7).
