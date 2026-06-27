# Architecture

| Field | Value |
|-------|-------|
| **Document** | System Architecture Overview |
| **Status** | 🔵 In review — authored, awaiting approval |
| **Phase** | 3 — Architecture |
| **Depends on** | [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) · [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) |
| **Authoritative sources** | [`.claude/architecture/*`](../.claude/architecture) · [`.claude/database/*`](../.claude/database) · [`.claude/security/*`](../.claude/security) · [`.claude/backend/*`](../.claude/backend) · [`.claude/api/*`](../.claude/api) |
| **Owner** | Principal Architect / CTO |

> This is the master system-architecture document for **StockFlow**. It is **design only** — no
> implementation. It explains *what the system is*, *how the pieces fit*, and **why each decision was
> made**, including the alternatives rejected. The detailed topic files in `.claude/` remain the source
> of truth for specifics; this document is the source of truth for *the system as a whole*.

---

## 0. How to read this document

Every significant choice is written as a decision block:

> **Decision** — what we do.
> **Why** — the reasoning, tied to the [non-negotiable principles](#11-architectural-principles).
> **Rejected** — the alternative we did not take, and why.

Decisions that were ratified earlier are cross-referenced to their ADR in
[design-decisions.md](../.claude/architecture/design-decisions.md) as **ADR-00x**.

---

## 1.1 Architectural principles

The whole architecture is the consequence of eight priorities, applied **in this tension-resolution
order** (when two pull against each other, the higher one wins):

1. **Correctness & data integrity** — *stock accuracy is the product*.
2. **Security** — secure by default, never optional.
3. **Maintainability & clean architecture** — SOLID, DRY, KISS, composition over inheritance.
4. **Scalability** — horizontal, async-first, 100k+ SKUs per tenant.
5. **Performance** — fast by default; measured, not guessed.
6. **Developer experience & consistency** — one way to do things.
7. **Type safety** — strict TypeScript end-to-end, no escape hatches.
8. **Accessibility & UX** — WCAG 2.1 AA, consumer-grade polish.

Eight invariants fall out of those priorities and hold **everywhere, with no exceptions**:

| # | Invariant | Enforced by |
|---|-----------|-------------|
| I1 | Every query/mutation is scoped to `organizationId` | Base tenant repository (data layer) |
| I2 | Every permission is enforced server-side | RBAC guard on every route |
| I3 | Every stock change is an append-only ledger entry inside a transaction | Inventory service + Mongo session |
| I4 | On-hand is a **projection**, never edited in place | `stock_levels` derived from `stock_movements` |
| I5 | Every input is validated (Zod DTO) and every output is validated (Response DTO) | Validation pipe + response mappers |
| I6 | Cross-tenant access returns **404**, never 403 (no existence leak) | Exception filter + object-level checks |
| I7 | Heavy / external work is async (queue), never inline in a request or transaction | BullMQ producers/consumers |
| I8 | No `any`, no disabled lint/TS, no secrets in code | CI gates (typecheck, lint, gitleaks) |

> These are not aspirations. They are the contract every module signs. The rest of this document is
> *how the topology makes them true by construction* — so an engineer cannot accidentally violate them.

---

## 2. System context (C4 — Level 1)

The black-box view: who talks to StockFlow, and what StockFlow talks to.

```
                         ┌───────────────────────────────────────────────┐
   Browser (Web app) ───▶│                                               │
   Mobile / Scanner   ──▶│                 STOCKFLOW                      │
   (future PWA)          │   correctness-first inventory management      │
   Integrations / API ──▶│                                               │
   Stripe webhooks    ──▶│                                               │
                         └───────────────────────────────────────────────┘
                            │        │        │        │        │      │
                   ┌────────┘   ┌────┘   ┌────┘   ┌────┘   ┌────┘  └────┐
                   ▼            ▼        ▼        ▼        ▼            ▼
               MongoDB        Redis  Cloudinary  Stripe  Resend   Sentry/PostHog
            (system of      (queues, (media +    (billing (email)  (errors,
             record +        cache,   CDN)        +meter)          analytics)
             ledger)         pub/sub)
```

**Actors**

| Actor | Interaction | Trust |
|-------|-------------|-------|
| **Web user** | HTTPS + WebSocket, session-cookie auth | Authenticated, tenant-scoped |
| **API/integration client** | REST with scoped, revocable API key | Authenticated, tenant + scope-limited |
| **Stripe** | Inbound signed webhooks | Verified by signature, not session |
| **Platform operator (Super Admin)** | Separate console; operates the SaaS, not a tenant role | Highest, audited |

**Why an external-dependency-heavy context** — StockFlow is **API-first** (ADR-007): every capability
is a documented REST endpoint, so the web app is *the first client, not the only one*. Mobile scanners,
partner integrations, and automation are first-class from day one. Each third party is chosen for a
single responsibility and is **replaceable behind an adapter** (see [§14](#14-third-party-boundaries)).

---

## 3. Container topology (C4 — Level 2)

Three deployable apps, one shared contract layer, four datastores/services.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENTS                                        │
│   Next.js Web (RSC + client islands)   ·   future mobile / integrations        │
└───────────────┬───────────────────────────────────────────┬──────────────────┘
                │ HTTPS (REST /api/v1)                        │ WSS (Socket.IO)
                ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  apps/api  —  NestJS                                                            │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │ REST        │  │ Socket.IO    │  │ Guards / Pipes │  │ Application services │  │
│  │ controllers │  │ gateway      │  │ Interceptors   │  │ (use cases)          │  │
│  └────────────┘  └──────────────┘  │ Filters        │  └──────────┬──────────┘  │
│                                     └───────────────┘             │             │
└───────────────┬───────────────────────┬───────────────┬──────────┼─────────────┘
                │ enqueue jobs           │ pub/sub        │ read/write           emit
                ▼                        ▼ (adapter)      ▼ (Mongoose)        domain events
        ┌───────────────┐        ┌───────────────┐  ┌───────────────┐            │
        │ Redis: BullMQ │        │ Redis: pub/sub │  │   MongoDB     │            │
        │ queues + DLQ  │        │ + Socket.IO    │  │ (replica set) │            │
        │ + cache + RL  │        │   adapter      │  │ ledger+record │            │
        └───────┬───────┘        └───────▲───────┘  └───────────────┘            │
                │ consume                 │ publish realtime events               │
                ▼                         │                                       │
┌──────────────────────────────────────────────────────────────────────────────┐
│  apps/worker  —  NestJS (standalone, no HTTP)                                   │
│  imports · exports · reports · emails · webhooks · alerts · audit fan-out       │
│  processors are thin + idempotent; carry organizationId; emit events ───────────┘
└──────────────────────────────────────────────────────────────────────────────┘

        shared by all apps:  packages/types (Zod contracts) · packages/config (env)
                             packages/utils · packages/ui · packages/icons · packages/hooks
```

> **Decision** — three apps: **web** (Next.js), **api** (NestJS HTTP + Socket.IO), **worker** (NestJS,
> no HTTP).
> **Why** — separating the **request path** (api, latency-sensitive, autoscaled on request load) from
> the **work path** (worker, throughput-sensitive, autoscaled on queue depth) lets each scale on its own
> signal and fail independently: a stuck 5-minute CSV import can never block a 50 ms stock read. The web
> app is a separate runtime because RSC/SSR and the API have different scaling and security profiles.
> **Rejected** — a single monolith (api + jobs in one process): a heavy job starves request handlers and
> couples deploy/scaling; a serverless-functions split: long-running imports and stateful WebSockets fit
> poorly in function timeouts.

> **Decision** — apps share **only** `packages/*`; they never import each other.
> **Why** — the only legitimate coupling between apps is the **data contract**, which lives in
> `packages/types` as Zod schemas. Everything else is private. This keeps the dependency graph acyclic
> and lets an app be redeployed without rebuilding the others (Turborepo caches the rest).
> **Rejected** — apps importing helpers from one another: creates cycles and accidental coupling.

---

## 4. Monorepo topology & dependency rules

```
/apps
  web      Next.js — UI, RSC, client data orchestration
  api      NestJS — REST + Socket.IO gateway (the request path)
  worker   NestJS — BullMQ consumers (the work path)
/packages
  types         Zod schemas → z.infer types — THE contract (leaf)
  config        env schema + shared constants (leaf)
  utils         pure helpers (leaf)
  ui            React component library (the only source of UI)
  icons         icon set + semantic aliases
  hooks         shared React hooks
  eslint-config / tsconfig   shared tooling config
/infrastructure   Docker, Railway, IaC
/scripts          dev/ops automation
/docs             product + engineering documentation
/.claude          engineering constitution + knowledge base
```

**Dependency direction (hard, CI-enforced):**

```
apps/*  ──▶  packages/*          ✅   (apps consume libraries)
packages/ui ──▶ icons, hooks, utils   ✅
packages/types, utils, config          ✅ leaves — depend on nothing internal
apps/* ──▶ apps/*                ❌   (apps never import apps)
packages/* ──▶ apps/*            ❌   (libraries never import app code)
any cycle                        ❌   (enforced via madge / eslint-plugin-import in CI)
```

> **Decision** — `packages/types` is the **single source of truth for every data contract**, authored as
> Zod schemas with static types via `z.infer`.
> **Why** — the same schema validates an API request body, types a React Hook Form, and validates a
> BullMQ job payload. One definition → runtime validation **and** compile-time types **and** cross-app
> agreement. Contracts cannot drift between web, api, and worker because there is only one of them.
> **Rejected** — hand-written TS interfaces (no runtime validation; drift), or class-validator DTOs
> (server-only; can't be shared into the web forms or job payloads). ADR records Zod for exactly this.

> **Decision** — pnpm workspaces + Turborepo.
> **Why** — pnpm's content-addressed store makes installs fast and disk-cheap and enforces strict,
> non-hoisted dependency boundaries (a package can't import what it didn't declare). Turborepo caches
> task outputs (typecheck/build/test/lint) locally and remotely, so CI rebuilds only what changed.
> **Rejected** — npm/yarn workspaces (looser boundaries, slower), Nx (heavier than needed for this shape).

---

## 5. Clean Architecture layering (inside `apps/api` and `apps/worker`)

Every backend feature is a **module** structured in four concentric layers; **dependencies point inward
only**.

```
        presentation  (controllers, DTOs, mappers, gateway handlers)
              │  depends on ▼
        application   (use cases / services, ports = interfaces, orchestration, transactions)
              │  depends on ▼
          domain      (entities, value objects, domain rules — ZERO framework imports)
              ▲  implements ports
      infrastructure  (Mongoose schemas, repositories, Cloudinary/Stripe/Resend adapters)
```

| Layer | Owns | May import | Must NOT import |
|-------|------|-----------|-----------------|
| **domain** | entities, value objects, invariants (e.g. `available ≥ 0`) | nothing framework-y | NestJS, Mongoose, Express, Zod runtime |
| **application** | use cases, ports (interfaces), transaction boundaries, event emission | domain | concrete infrastructure |
| **infrastructure** | Mongoose models, repositories, third-party adapters | domain + application ports | presentation |
| **presentation** | controllers, request/response DTOs, mappers, socket handlers | application | infrastructure internals |

> **Decision** — the **domain layer is framework-free**; infrastructure implements **ports** defined by
> the application layer (dependency inversion).
> **Why** — business rules (the part that *is* the product) become testable in isolation, survive a
> framework or database swap, and can't be corrupted by an ORM detail leaking upward. Controllers stay
> thin: validate → delegate → map. Logic that matters lives in one predictable place.
> **Rejected** — "fat controller / active-record" style (logic smeared across controllers and Mongoose
> documents): untestable, framework-locked, and impossible to keep DRY at 8 bounded contexts.

> **Decision** — controllers/gateways return **domain results**; a mapper produces the **Response DTO**.
> Mongoose documents are **never** serialized directly to clients.
> **Why** — output is an explicit allowlist (I5). Internal fields, future columns, and other tenants'
> references can never leak by accident. The wire shape is a deliberate contract, not a database dump.

---

## 6. Module boundaries (bounded contexts)

Eight modules, each owning its data and exposing a **public service interface**. Cross-module reads go
through the owning service; cross-module side effects go through **domain events** — never direct
repository access.

| Module | Owns | Must not touch |
|--------|------|----------------|
| **Identity & Access** | users, sessions, memberships, roles, permissions | inventory data |
| **Catalog** | products, variants, categories, brands, units | stock quantities |
| **Inventory** | stock ledger, levels, reservations, transfers, counts, adjustments | order lifecycle |
| **Locations** | warehouses, zones, bins | catalog |
| **Procurement** | suppliers, purchase orders, receiving | sales |
| **Sales / Fulfillment** | sales orders, allocations, picking/shipping | procurement |
| **Reporting** | read-models, valuation, analytics (read-only) | any write to domain data |
| **Platform** | org settings, billing, notifications, audit, files | domain logic |

> **Decision** — **Inventory is the only module permitted to write the stock ledger.** Procurement
> receiving and Sales fulfillment *ask* Inventory to post movements; they never write `stock_movements`
> themselves.
> **Why** — invariant I3/I4 (ledger correctness) is enforceable only if there is exactly one writer. A
> single choke point means one place to audit, one place to wrap in a transaction, one place to keep
> idempotent. This is the structural expression of "stock accuracy is the product."
> **Rejected** — letting each module mutate stock directly: every module becomes a place a bug can corrupt
> on-hand quantities; the invariant becomes unverifiable.

> **Decision** — cross-module communication is via **public service ports + domain events**, not shared
> repositories.
> **Why** — modules stay independently understandable and independently testable; an event-driven seam
> (e.g. `StockMovementRecorded` → audit + notification + low-stock check) keeps side effects decoupled
> from the transaction that triggered them.

---

## 7. Frontend architecture (`apps/web` — Next.js)

```
src/app/                 App Router routes — thin; no business logic
   features/<feature>/   colocated: components, hooks, queries, schemas
   lib/                  API client · TanStack Query · Better Auth client · socket client
   stores/               Zustand — global *UI* state only (theme, sidebar, command palette)
   styles/               globals.css — Tailwind v4 @theme tokens
   (all primitives import from @stockflow/ui — never built in pages)
```

**Rendering & data**

| Concern | Choice | Why |
|---------|--------|-----|
| Routing / rendering | **Next.js App Router**, React Server Components by default; client islands where interactive | Server-render the shell and read-mostly pages for fast first paint + SEO-irrelevant-but-fast dashboards; ship JS only for interactive islands |
| Server data (cache) | **TanStack Query** | Caching, background refetch, optimistic updates, and **targeted invalidation on realtime events** — the client cache is the realtime sync target |
| Forms | **React Hook Form + Zod** (schema from `packages/types`) | The *same* schema validates client-side and on the server; uncontrolled inputs = fewer re-renders |
| Global UI state | **Zustand** | Theme, sidebar, ⌘K palette open-state — *UI only*. Server data is never duplicated into Zustand (that's TanStack Query's job) |
| Tables | **TanStack Table** | Headless, virtualization-ready for 100k-row datasets, server-driven pagination/sort/filter |
| Charts | **Recharts** | Token-driven, composable, SSR-safe |
| Animation | **Framer Motion** (`motion/react`) | Token-driven, respects reduced-motion |
| Components | **`@stockflow/ui` only** | One source of UI; pages never hand-roll primitives (golden rule) |

> **Decision** — RSC by default, client components only for interactivity; **TanStack Query owns all
> server state**, Zustand owns only UI state.
> **Why** — keeps bundles small and draws a hard line that prevents the classic bug of two
> sources of truth for the same data. Realtime updates have exactly one place to land: a query
> invalidation. The boundary "is this server data or UI state?" answers every state-placement question.
> **Rejected** — Redux/RTK global store for everything (boilerplate + duplicated server cache), or fetching
> in `useEffect` (no caching, waterfalls, no invalidation story).

> **Decision** — the web app **consumes the same REST API** as any other client; auth is the Better Auth
> client talking to the api over httpOnly cookies. No private "BFF backdoor."
> **Why** — API-first (ADR-007) means the web app gets no special access path; what the web app can do,
> the documented API can do. One auth model, one authorization model, one set of tests.

> **Build dependency** — the web app imports the **built** `dist` of `@stockflow/ui`; CI builds the
> library before typechecking the web app. (Operational note carried from the component-library phase.)

---

## 8. Backend architecture (`apps/api` — NestJS)

### 8.1 Request lifecycle (the cross-cutting pipeline)

Every HTTP request passes through the same ordered chain — this is where invariants I1, I2, I5, I6 are
made true *for every endpoint at once*, not re-implemented per controller.

```
request
  │
  ▼  ① Helmet/CORS/CSRF + rate limit            (security headers, abuse control)
  ▼  ② AuthGuard            → resolves AuthContext {userId, organizationId, roles, permissions}
  ▼  ③ TenantContext         → organizationId pinned for this request (from session, never body)
  ▼  ④ PermissionGuard       → route's required permission ∈ AuthContext.permissions ? else 403/404
  ▼  ⑤ ValidationPipe (Zod) → request DTO parsed, unknown fields rejected, types coerced
  ▼  ⑥ Controller (thin)     → delegates to application service
  ▼     Application service → domain rules, transaction, emit events
  ▼  ⑦ Response mapper       → explicit Response DTO (allowlist)
  ▼  ⑧ LoggingInterceptor    → structured Pino log w/ requestId, org, actor, durationMs
  │
  ▼  ⑨ ExceptionFilter (on throw) → domain error → HTTP status + stable error envelope
response
```

> **Decision** — auth, tenant scoping, permissions, validation, serialization, logging, and error mapping
> are **cross-cutting blocks** (guards / pipes / interceptors / filters), not per-controller code.
> **Why** — an invariant enforced in one shared place cannot be forgotten in the 200th endpoint. Adding a
> route automatically inherits tenant isolation, permission checks, validation, and the error envelope.
> Consistency becomes the path of least resistance (principle 6).
> **Rejected** — checking auth/tenant inside each controller method: guaranteed to be forgotten somewhere,
> and that one omission is a cross-tenant breach.

### 8.2 Service / repository rules

- **Controllers are thin** — validate DTO, call use case, map result. No business logic.
- **Application services** hold orchestration, transactions, and invariant enforcement; they depend on
  **ports**, not concrete repositories.
- **Repositories** extend a **base tenant repository** that auto-injects `organizationId` into every
  filter and every insert (I1). A query that reaches Mongo without tenant scope is a bug the base class
  makes structurally impossible.
- **No framework types leak into the domain** — repositories return domain objects, not Mongoose docs.

### 8.3 API surface standards

| Concern | Standard |
|---------|----------|
| Style | Resource-oriented REST, plural kebab-case paths (`/api/v1/sales-orders`) |
| Versioning | **URI versioning** `/api/v1`; additive changes don't bump, breaking changes → new major |
| Pagination | **Cursor-based** primary (opaque, signed cursor; stable under inserts); offset allowed for small admin lists; `limit` default 20, max 100 |
| Filtering / sorting | `filter[field][op]=`, `sort=-field`; **allow-listed per endpoint**, every filterable/sortable field is indexed; tenant scope can't be widened by the client |
| Envelope | `{ data }` / `{ data, meta }` / `{ error: { code, message, details, requestId } }` |
| Error codes | Stable machine-readable: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR` + domain codes (`INSUFFICIENT_STOCK`, `INVALID_STATE_TRANSITION`) |
| Docs | **Swagger/OpenAPI generated from DTOs** — docs can't drift from the code |

> **Decision** — cursor pagination as the default for domain lists.
> **Why** — at 100k+ SKUs, offset pagination degrades (`skip` scans skipped docs) and is unstable when
> rows are inserted/deleted mid-scroll. An opaque signed cursor encoding sort position is O(1) to resume
> and stable. Offset stays available for short admin lists where "jump to page 7" matters.
> **Rejected** — offset-only (slow + unstable at scale).

> **Decision** — cross-tenant resource access returns **404, not 403** (I6).
> **Why** — a 403 confirms the resource exists; that's an existence-leak across tenants. 404 reveals
> nothing. Authorization failures *within* your own tenant still return 403.

---

## 9. Database architecture (MongoDB + Mongoose)

> **Decision** — **MongoDB** (replica set) with Mongoose. (ADR records the stack.)
> **Why** — the catalog is naturally document-shaped and schema-flexible across tenants (custom attributes
> per product); replica sets give **multi-document ACID transactions** (required for I3); compound indexes
> leading with `organizationId` make tenant-scoped reads fast; and the document model fits the append-only
> ledger + projection pattern cleanly. **Rejected** — a relational store would force rigid schemas across
> heterogeneous tenant catalogs and add migration friction; we keep strong consistency only where it's
> needed (stock writes) rather than paying for it everywhere.

### 9.1 Collections (system of record)

`organizations` · `users` · `memberships` · `roles` · `permissions` · `products` · `variants` ·
`categories` · `brands` · `units` · `warehouses` · `locations` · `stock_levels` · `stock_movements` ·
`reservations` · `transfers` · `counts` · `suppliers` · `purchase_orders` · `sales_orders` ·
`audit_logs` · `notifications` · `subscriptions` · `files`.

**Every document carries:** `_id`, `organizationId` (required, immutable), `createdAt`, `updatedAt`,
`deletedAt` (nullable — soft delete), `createdBy`, `updatedBy`.

### 9.2 Catalog model — Product → Variant → Stock (ADR-003)

```
Product  (catalog parent: "Acme Widget")
   │ 1:*  (variant.productId)
   ▼
Variant  (sellable/stockable unit: "Acme Widget — Red / M", carries sku + barcode)
   │ ×Location
   ▼
StockLevel   (projection, 1 per variantId×locationId)   ← summed from →   StockMovement (ledger, append-only)
```

> **Decision** — stock lives on the **variant**, not a flat SKU table.
> **Why** — real catalogs are products with variations; modeling variants explicitly avoids the flat-SKU
> dead end (duplicated product attributes, impossible roll-ups) and gives each variant a per-tenant-unique
> SKU. **Rejected** — flat SKU rows (no shared product attributes, no clean variant analytics).

### 9.3 Immutable ledger + projection (ADR-002) — the keystone

```
stock_movements  (APPEND-ONLY — the source of truth)
   { organizationId, variantId, locationId, delta(±int), type, reasonRef, createdAt, opKey }
        │  Σ(delta) per (variant, location)
        ▼
stock_levels     (PROJECTION — fast read, fully reconcilable)
   { organizationId, variantId, locationId, onHand, reserved }   available = onHand − reserved
```

**Invariants:** `stock_level.onHand ≡ Σ(stock_movements.delta)` for each (variant, location); and
`available = onHand − reserved ≥ 0` (unless a tenant explicitly allows negative stock).

> **Decision** — stock is an **immutable ledger**; on-hand is a **derived projection**, never edited in
> place (I3/I4).
> **Why** — *every quantity becomes explainable*: you can reconstruct on-hand at any point in time by
> replaying movements, which is the difference between an inventory system you can trust and one you can't.
> Reconciliation is a first-class query (sum the ledger, compare the projection), not a forensic
> exercise. Audit-grade by construction.
> **Rejected** — mutating an on-hand counter directly: fast to write, impossible to audit; a lost update
> or a bug silently corrupts the number that *is the product*, with no trail to detect or repair it.

### 9.4 Transactions (when ACID is mandatory)

A MongoDB multi-document transaction wraps the ledger write **and** every projection/related-doc update
for: **adjustments · receiving against a PO · transfers (paired out/in + in-transit) · reservation
create/release · fulfillment/shipping · count approval**.

Transaction rules:
- Read current `stock_level` *in the session*; assert non-negative invariants **before** commit.
- **Idempotent** via an operation key (`opKey`) — a retried request never double-posts (I7 safety).
- **No external I/O inside a transaction** (no email, no Cloudinary) — emit a domain event instead and let
  the worker do it after commit.
- Retry `TransientTransactionError` / `WriteConflict` with bounded backoff.

> **Decision** — keep transactions **short, Mongo-only, idempotent**, with side effects emitted as events.
> **Why** — long transactions holding external calls multiply lock time and failure surface; an email
> provider hiccup must never roll back a stock posting. Idempotency keys make at-least-once retries safe.

### 9.5 Multi-tenancy & indexing (ADR-001)

- **Shared DB, hard `organizationId` scoping** enforced centrally in the base repository — never per call
  site (I1). `organizationId` comes from the **session**, never the request body.
- **Compound indexes always lead with `organizationId`**; uniqueness is per-tenant
  (`{ organizationId, sku }` unique, not `{ sku }`).
- Index order follows **ESR (Equality, Sort, Range)**; every filterable/sortable API field is backed by an
  index; partial indexes exclude soft-deleted docs on hot paths.
- **Adversarial cross-tenant tests are mandatory** in CI: user in org A must never read/write org B by any
  endpoint, id guess, filter, or bulk op.

> **Decision** — shared database with row-level tenant scoping, not a database/schema per tenant.
> **Why** — lowest operational overhead at scale (one cluster, one migration path, one backup), and the
> scoping is enforceable by construction in a base repository. **Rejected** — DB-per-tenant (operational
> explosion at thousands of tenants, painful cross-tenant analytics, slow onboarding). The trade-off — a
> scoping bug is a breach — is mitigated by *centralizing* scoping in one class and *adversarially testing*
> it. Very large tenants are addressed by `organizationId` as the shard key (see [§17](#17-scalability--failure-modes)).

### 9.6 Audit log

`audit_logs` is **append-only, immutable**: `{ organizationId, actorId, actorType, action, entityType,
entityId, before, after (redacted), metadata{ip, userAgent, requestId}, createdAt }`. Written
server-side close to the mutation so it can't be bypassed; secrets/PII redacted; indexed for entity
trails and actor trails; exported via an async job, never a synchronous endpoint.

> **Decision** — stock movements are themselves audit-grade; `audit_logs` covers everything *else*
> (config, permissions, orders, exports, security denials).
> **Why** — avoids double-logging stock while still giving a tamper-evident trail for SOC-2 readiness and
> incident investigation.

---

## 10. Redis architecture — four distinct roles

> **Decision** — one Redis, **four responsibilities**, logically separated by key namespace/instance.
> **Why** — each role needs Redis's speed but for different reasons; consolidating avoids extra infra
> while the namespaces keep concerns isolated (and allow splitting onto separate instances later without
> code change).

```
┌─ Redis ─────────────────────────────────────────────────────────────────┐
│ ① BullMQ queues   job state, delays, retries, DLQ        (api → worker)   │
│ ② Pub/sub + Socket.IO adapter   realtime fan-out across api instances     │
│ ③ Cache           hot, slow-changing reads w/ explicit invalidation + TTL │
│ ④ Rate limiting / ephemeral   auth throttling, idempotency markers        │
└──────────────────────────────────────────────────────────────────────────┘
```

| Role | What | Notes |
|------|------|-------|
| **① Queues** | BullMQ job storage, scheduling, retries, dead-letter | The api enqueues; the worker consumes |
| **② Pub/sub + adapter** | Socket.IO Redis adapter broadcasts events to all api instances | Makes WebSockets horizontally scalable |
| **③ Cache** | Permission sets, reference data, expensive read-models | **Explicit invalidation** on write; TTL as a backstop, never the primary correctness mechanism |
| **④ Rate limit / ephemeral** | Login/throttle counters, short-lived idempotency markers | TTL-managed |

> **Decision** — caching uses **explicit invalidation**, with TTL only as a safety net.
> **Why** — for an inventory product, a stale cached quantity is a correctness bug (principle 1 beats
> principle 5). Writes invalidate the relevant keys deterministically; TTL just bounds the blast radius of
> any miss. **Rejected** — TTL-only caching for stock-adjacent data (windows of wrong numbers).
>
> **Phasing** — v1 implements **① queues** and **② adapter** (required for async + realtime). **③ cache**
> and Redis-backed **session store** are introduced when read load and instance count justify them; Better
> Auth can use a simpler session store at low scale. This is recorded so we don't prematurely add cache
> invalidation complexity before it earns its keep.

---

## 11. Queues & async processing (BullMQ)

> **Decision** — anything heavy, slow, or externally-dependent runs **async on a queue**, never inline in
> a request or a DB transaction (I7).
> **Why** — keeps the request path's p95 low and predictable, isolates third-party latency/outages from
> the user, and gives retries + backpressure for free. A request returns a `jobId`; the UI tracks
> progress over realtime/polling.

**What is async**

| Queue | Jobs | Why async |
|-------|------|-----------|
| `imports` | CSV/XLSX bulk product/stock import (row-validated, per-row errors) | Minutes-long; must not block a request |
| `exports` | report/data exports, audit-log export | Large aggregations + file generation |
| `reports` | heavy analytics/valuation aggregations | CPU/IO heavy; cache the result |
| `emails` | transactional email via Resend | External provider latency/outage isolation |
| `webhooks` | outbound HTTP to integrations | Retries + backoff; never block the caller |
| `alerts` | low-stock evaluation, threshold checks | Triggered by events; fan-out |
| `audit`/notifications fan-out | persist + deliver derived from domain events | Decouple side effects from the transaction |

**Job rules (invariants):**
- **Idempotent** — at-least-once delivery; an `opKey`/job key dedupes so a redelivery doesn't double-act.
- **Retries** with exponential backoff + jitter; capped attempts; exhausted → **dead-letter queue** for
  inspection (never silently dropped — observability requirement).
- **Stateless** — jobs carry IDs + `organizationId`, fetch fresh state at run time; no large payloads.
- **Tenant-scoped** — every job carries `organizationId` and scopes all reads/writes (I1 holds in the
  worker too).
- **Typed payloads** — validated with the **same Zod schemas** from `packages/types`.
- Long jobs **emit progress** so the UI can show it.

```
POST /imports ──▶ api validates + enqueue(imports, {fileId, orgId, opKey}) ──▶ 202 { jobId }
                                          │
                       Redis (BullMQ) ◀───┘
                                          │ consume
                       worker processor ──┴─▶ parse → per-row validate → post movements (Inventory svc)
                                              → emit ImportCompleted ──▶ notification + realtime event
                       on failure ─▶ retry(backoff) ─▶ exhausted ─▶ DLQ + alert
```

> **Decision** — exhausted jobs go to a **DLQ**, not `/dev/null`.
> **Why** — a silently dropped import is an invisible data-integrity gap. DLQ + alert turns a silent
> failure into an actionable one (observability / principle 1).

---

## 12. Workers (`apps/worker`)

> **Decision** — a **dedicated NestJS app with no HTTP server**, consuming BullMQ queues.
> **Why** — physical separation of the work path from the request path (the core reason there are three
> apps): scale on **queue depth**, deploy independently, and guarantee a heavy job can't degrade API
> latency. Reusing NestJS means the worker shares the same DI, config, Mongoose models, domain services,
> and `packages/types` contracts as the api — no logic is duplicated, and a movement posted by the worker
> obeys the *same* Inventory service and transaction rules as one posted by the api.

```
apps/worker/src/processors/<queue>/
   jobs/         typed job definitions + Zod schemas (shared from packages/types)
   <queue>.processor.ts   thin, idempotent; carries organizationId; emits domain events
```

**Worker ↔ API relationship** — they do **not** call each other over HTTP. They cooperate through three
shared channels:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| MongoDB | both | shared system of record; worker reads current state, writes results via the same domain services |
| Redis / BullMQ | api → worker | api enqueues, worker consumes |
| Redis pub/sub | worker → api | worker publishes realtime/domain events; api's Socket.IO gateway broadcasts |

> **Decision** — worker→client realtime goes **worker → Redis pub/sub → api gateway → socket**, not
> worker-opens-its-own-WebSocket.
> **Why** — the worker has no HTTP/WebSocket server and shouldn't; the api already owns authenticated
> socket connections and tenant rooms. Pub/sub is the clean seam between the work path and the realtime
> path. **Rejected** — worker maintaining its own socket server (duplicate auth, duplicate connection
> state, two places to secure).

---

## 13. Authentication & Authorization

### 13.1 Authentication — Better Auth

> **Decision** — **Better Auth** with **httpOnly, Secure, SameSite session cookies** + CSRF protection;
> **no long-lived bearer tokens in the browser**. Integrations use separate, scoped, revocable **API
> keys** (stored hashed).
> **Why** — cookie sessions are immune to the XSS token-exfiltration class that plagues `localStorage`
> JWTs; httpOnly means JS can't read them, SameSite + CSRF tokens cover cross-site abuse. Passwords are
> hashed with an adaptive algorithm; verification emails, signed single-use invitations, and auth-endpoint
> rate-limiting/lockout come built in. **Rejected** — JWT-in-localStorage (XSS-exfiltratable, hard to
> revoke). MFA/TOTP and SSO/SAML/OIDC are Enterprise-roadmap; we design hooks now without blocking v1.

**The AuthContext (the linchpin of I1 + I2)** — derived **server-side per request** from the session:
`{ userId, organizationId, roles, permissions }`. It is the **only** source of identity; client-provided
identity/tenant fields are never trusted. Every authorization and tenant check reads from it.

### 13.2 Authorization — RBAC, deny-by-default (ADR-005)

```
Permission  = atomic "<resource>.<action>"   (e.g. product.create, stock.adjust, po.approve)
Role        = named bundle of permissions (system or custom), optionally warehouse-scoped
Membership  = user ↔ organization, carrying one or more roles
Effective permissions = union(role permissions)  ∩  scope     [deny by default]
```

**System roles:** Organization Owner · Admin · Inventory Manager · Purchasing Manager ·
Sales/Fulfillment · Warehouse Staff (warehouse-scoped) · Viewer/Auditor. **Custom roles** at Growth+
tiers. Platform **Super Admin** operates the SaaS and is *not* a tenant role.

> **Decision** — **deny-by-default, least-privilege, server-enforced** permissions; the UI **mirrors**
> the check for UX but never replaces it (I2).
> **Why** — the client is untrusted; the only authorization that counts is the one the server makes. Deny
> by default means a new endpoint is locked until a permission is explicitly required — failures are
> closed, not open. Granular permissions bundled into roles give enterprises the flexibility they expect
> without per-user ACL sprawl. Role/permission changes take effect immediately and are audit-logged.
> **Rejected** — coarse role checks only (can't express "view but not adjust"), or trusting UI-hidden
> actions (trivially bypassed by calling the API directly).

### 13.3 Tenant isolation — defense in depth

Four independent layers must all agree, so a single mistake is not a breach:

```
① AuthContext   organizationId from session (never from input)
② Data layer    base repo auto-scopes every query/write by organizationId
③ Authorization object-level check: target.organizationId == ctx.organizationId
④ Responses     foreign/unknown id ⇒ 404; never include cross-tenant refs
```

### 13.4 Socket authentication

Socket.IO handshakes **reuse the Better Auth session cookie**; the same AuthContext (incl.
`organizationId`) is derived at connect time, and the socket is joined to room `org:<organizationId>`. A
client therefore only ever receives its own tenant's events — tenant isolation extends to realtime (I1).

---

## 14. Third-party boundaries

> **Decision** — every third party sits **behind an adapter in the infrastructure layer**, implementing
> an application-defined **port**.
> **Why** — the domain/application layers depend on `EmailPort`, `MediaStoragePort`, `BillingPort` — not
> on Resend/Cloudinary/Stripe. A provider can be swapped, mocked in tests, or wrapped with retries/circuit
> breakers in exactly one place. This is dependency inversion applied at the system edge.

### 14.1 Cloudinary — file & media storage

> **Decision** — **signed, direct-to-Cloudinary uploads** with the secret held server-side; files land in
> a per-org folder via a `temp/` quarantine; metadata recorded in the `files` collection.
> **Why** — the browser uploads large files straight to Cloudinary (no API bandwidth/latency cost) while
> the **secret never leaves the server** — the api only issues a short-lived signature after validating
> type and size. Quarantine-first allows a future virus-scan/processing step before an asset is promoted
> and linked to an entity. **Rejected** — proxying uploads through the api (doubles bandwidth, ties up
> request workers), or unsigned client uploads (exposes the account to abuse).

```
client ──▶ api: "I want to upload" ──▶ api validates type/size, returns SIGNED params
client ──▶ Cloudinary (direct, signed) ──▶ temp/ quarantine
Cloudinary/webhook or confirm ──▶ api: validate (magic-byte sniff, strip EXIF) ──▶ promote to
   inventory/organizations/<orgId>/<entity>/ ──▶ record files{ publicId, folder, tags, version, uploadedBy }
```

Folders are **per-organization** (`inventory/organizations/<orgId>/...`) for isolation and lifecycle;
storage keys are server-generated (never raw client filenames); access via signed URLs scoped
appropriately; per-tenant quotas count toward plan usage.

### 14.2 Stripe (billing) · Resend (email)

- **Stripe** — subscriptions, metering, invoices; **inbound webhooks verified by signature** (not
  session) and processed idempotently (replays are common). Billing state mirrored into `subscriptions`.
- **Resend** — all email is **sent from the worker via the `emails` queue** (never inline in a request),
  idempotent per `opKey`, with sends logged for audit/retry.

### 14.3 Secrets

> **Decision** — **no secrets in code, ever** (I8). Secrets come from environment / Railway secret store,
> validated at boot (fail-fast), distinct per environment, never logged, scanned in CI (gitleaks).
> **Why** — secrets in source are the most common catastrophic leak; `NEXT_PUBLIC_*` is public by
> definition so server secrets never use that prefix. Fail-fast at boot turns a missing-secret production
> incident into a deploy-time error.

---

## 15. Notifications

> **Decision** — a **dual-channel** notification system: **in-app** (persisted + realtime) and **email**
> (async via Resend), both driven by **domain events**, not inline calls.
> **Why** — users need immediate in-product awareness (badge, banner, notification center) *and*
> out-of-band reach (email) for things they should know when not logged in. Driving both from one event
> stream keeps them consistent and decoupled from the transaction that triggered them.

```
domain event (e.g. StockMovementRecorded → low stock)  ──▶ NotificationService.notify(orgId, payload)
        │                                                         │
        ▼ persist                                                 ▼ enqueue(emails)
  notifications collection                                  worker → Resend
        │ publish notification:created (Redis pub/sub)
        ▼
  Socket.IO gateway → room org:<orgId> → web client
        → badge count + banner (Notification component) + notification center list (paginated)
```

| Channel | Timing | Persistence | Component |
|---------|--------|-------------|-----------|
| **In-app** | realtime (Socket.IO) | `notifications` collection (soft-dismiss) | `@stockflow/ui` Notification + notification center |
| **Email** | async (`emails` queue → Resend) | send logged for audit/retry | Resend templates |

**Notification types (planned):** low-stock alerts · import/export completion · PO received · SO shipped ·
user invitations · admin/system alerts (failed jobs) · tenant-configured custom rules. All tenant-scoped
and (for in-app) targeted to a user or broadcast to the org.

---

## 16. Real-time

> **Decision** — **Socket.IO gateway hosted on the api**, scaled across instances by the **Socket.IO Redis
> adapter**, with **per-tenant rooms** and **worker-originated events via Redis pub/sub**.
> **Why** — realtime stock and job-progress updates are a core UX promise. Hosting the gateway on the api
> reuses the existing auth/tenant context for the handshake; the Redis adapter makes WebSockets work across
> many api instances (an event emitted on instance A reaches a socket connected to instance B); rooms keyed
> by `organizationId` enforce tenant isolation on the realtime plane.

```
worker  ── publish events:<orgId>:<type> ──▶  Redis pub/sub  ──▶  every api instance (Socket.IO adapter)
                                                                        │ emit to room org:<orgId>
                                                                        ▼
                                                          web clients in that org
                                                          → TanStack Query invalidation (data refresh)
                                                          → store update (badge counts, toasts)
```

**Event flow** — a worker (or an api write) emits a typed domain event → published to Redis pub/sub keyed
by `organizationId` → the Socket.IO adapter fans it out to all api instances → each emits to room
`org:<orgId>` → connected clients react, typically by **invalidating the relevant TanStack Query** so the
UI re-fetches authoritative data (the socket signals *what changed*; the REST API remains the source of
truth for *the new value*).

**Event taxonomy (planned):** stock movement / ATP change · import-export progress & completion ·
notification created (badge) · location/warehouse state change · low-stock alert · selected audit/system
events (per tenant).

> **Decision** — realtime events are **signals, not authoritative payloads**; clients re-fetch via REST on
> receipt.
> **Why** — keeps one source of truth (the API/DB) and avoids trusting a broadcast for a number that must
> be correct; also keeps event payloads small and avoids leaking data the recipient socket shouldn't see.
> **Rejected** — pushing full authoritative state over sockets (two sources of truth; harder to secure
> field-level access).

---

## 17. Cross-cutting: domain events, observability, config

### 17.1 Domain events & audit pipeline

Services emit typed domain events (`StockMovementRecorded`, `OrderShipped`, `MemberInvited`, …) captured
within the transaction and **published after commit**. One event drives several decoupled consumers —
audit-log persistence, notifications, low-stock evaluation, analytics fan-out — without the originating
use case knowing about any of them. This is how side effects stay out of transactions (§9.4) while still
being guaranteed.

### 17.2 Observability

| Concern | Tool | Decision & why |
|---------|------|----------------|
| Logging | **Pino** | Structured JSON; a **correlation/`requestId` propagates request → service → job** so one trace spans api and worker. Never logs secrets/PII (redaction). `console.log` is banned. |
| Errors | **Sentry** | Exceptions reported with `requestId` + release + source maps; the global exception filter is the single funnel. |
| Analytics | **PostHog** | Product event tracking, self-host-capable. |
| Health | health/readiness endpoints | Mongo/Redis connectivity checks for the platform load balancer + deploy gating. |
| Config | **`packages/config` Zod `EnvSchema`** | Validated at boot in every app; **fail-fast** on missing/invalid env — no silent defaults for critical values. |

### 17.3 Error handling

Typed domain errors thrown in services (`InsufficientStockError`, `InvalidStateTransitionError`) are
mapped by the global **exception filter** to HTTP status + the stable error envelope: validation→400,
unauthenticated→401, forbidden→403, **cross-tenant→404**, conflict→409, semantic rule→422, rate→429,
unexpected→500. Stack traces and internal messages never reach the client; `requestId` always does.

---

## 18. Deployment topology & environments

> **Decision** — **Docker** images per app, deployed on **Railway**, built/tested/shipped by **GitHub
> Actions**, with **Turborepo remote caching** for CI speed.
> **Why** — Railway gives managed Mongo/Redis, per-service horizontal scaling, and simple environment
> promotion without standing up a Kubernetes platform we don't yet need; Docker keeps the runtime identical
> across environments; remote cache means CI rebuilds only what changed. **Rejected** — bespoke
> Kubernetes (operational weight unjustified at this stage); single-VM (no independent scaling, single
> point of failure).

```
GitHub Actions ── typecheck · lint · test · build (Turbo cache) · gitleaks ──▶ Docker images
       │                                                                          │
       ▼ promote                                                                  ▼
   dev ─────────▶ staging ─────────▶ production       Railway services: web · api · worker
                                                       managed: MongoDB (replica set) · Redis
```

**Environments:** dev · staging · production — **distinct secrets and credentials per environment**
(least privilege). Apps are **stateless** (state lives in Mongo/Redis/Cloudinary), so each scales
horizontally behind the platform load balancer: **api on request load, worker on queue depth**.

---

## 19. Scalability & failure modes

**Targets:** 100k+ SKUs/tenant · P95 reads < 300 ms, writes < 600 ms · interactive dashboard < 2 s ·
99.9% availability.

**Tactics (mapped to decisions above):**
- **Stateless apps** → horizontal scale on independent signals (§3, §18).
- **Indexes designed before code**, every one justified; ESR ordering; tenant-leading (§9.5).
- **Read-models/projections** (`stock_levels`, report read-models) so dashboards never aggregate hot paths
  live (§9.3, §11).
- **Cursor pagination** everywhere for large lists (§8.3).
- **Redis cache** with explicit invalidation for hot, slow-changing reads (§10).
- **Async by default** absorbs spikes via queue backpressure (§11).

**Failure modes & responses:**

| Failure | Response |
|---------|----------|
| Hot-partition tenant (very large org) | `organizationId` as **shard key**; tenant-leading indexes keep scans local |
| Ledger growth (movements table unbounded) | Rollup/archival of old movements; projection remains the read path |
| Third-party outage (Stripe/Cloudinary/Resend) | Adapter + queue retries + **circuit breakers**; graceful degradation; webhooks idempotent |
| Job storm / poison job | Per-queue concurrency + rate limits; bounded retries → **DLQ + alert** |
| api instance loss | Stateless + Redis adapter → sockets reconnect to another instance, rooms intact |
| Transaction contention | Short Mongo-only transactions; bounded `WriteConflict` retries; idempotency keys |
| Cross-tenant access attempt | Four-layer isolation → 404; adversarial tests in CI catch regressions |

---

## 20. End-to-end walkthroughs

**A. Receive stock against a Purchase Order (write path + integrity)**
```
1. PATCH /api/v1/purchase-orders/:id/receive   (AuthCtx resolved, permission po.receive checked, DTO validated)
2. Procurement service asks Inventory service to post receipts (Inventory is the only ledger writer)
3. Inventory opens a Mongo transaction:
     append stock_movements(+qty, type=receipt, opKey)   ·   update stock_levels.onHand
     update purchase_order state + valuation              ·   assert invariants (onHand ≥ 0)
   commit (idempotent: replay with same opKey is a no-op)
4. emit StockMovementRecorded + PurchaseOrderReceived  (after commit)
5. consumers: audit_logs persisted · low-stock re-evaluated · notification created · email enqueued
6. realtime: worker/api publishes events:<orgId>:stock → gateway → room org:<orgId>
7. web: TanStack Query for that variant/PO invalidates → UI re-fetches authoritative numbers
```

**B. Bulk CSV import (async path)**
```
1. client gets a signed Cloudinary upload → uploads file to temp/  → POST /imports {fileId}
2. api validates, enqueue(imports,{fileId,orgId,opKey}) → 202 {jobId}
3. worker: parse → per-row Zod validate → post movements via Inventory service (transactional, idempotent)
   → emit progress events (realtime progress bar)
4. on complete: ImportCompleted → notification + email; on row errors: per-row error report
5. on fatal failure: bounded retries → DLQ + alert (never silently dropped)
```

---

## 21. Trade-off log (ADR references)

| ADR | Decision | Primary trade-off accepted |
|-----|----------|----------------------------|
| ADR-001 | Multi-tenant shared DB, `organizationId` scoping | Scoping bug = breach → mitigated by central enforcement + adversarial tests |
| ADR-002 | Immutable stock ledger + projection | More writes/storage → bought: full auditability & reconciliation |
| ADR-003 | Product → Variant → Stock | More joins/refs → bought: correct variant modeling at scale |
| ADR-004 | Hierarchical locations (bins optional) | Slightly more complex schema → one model fits corner-shop to enterprise |
| ADR-005 | Granular RBAC, deny-by-default | More permission plumbing → least-privilege, enterprise-grade authz |
| ADR-006 | Async by default (BullMQ) | Eventual consistency for heavy work → low, predictable request latency |
| ADR-007 | API-first REST | Up-front API discipline → multi-client (web, mobile, integrations) |

**Stack ADRs:** NestJS · MongoDB/Mongoose · Zod contracts in `packages/types` · Better Auth · Socket.IO +
Redis adapter · Pino · Sentry · PostHog · Cloudinary · Stripe · Resend · pnpm + Turborepo · Docker +
Railway + GitHub Actions. Each recorded in
[design-decisions.md](../.claude/architecture/design-decisions.md).

---

## 22. Open decisions (require ratification)

| Topic | Proposed default | Status |
|-------|------------------|--------|
| Inventory valuation method | Weighted-average | 🟡 pending |
| Monetization shape | Hybrid seats + usage caps | 🟡 pending |
| Redis-backed session store cutover | Introduce at instance-count/load threshold | 🟡 phasing decision |
| Cache layer rollout | After read load justifies invalidation complexity | 🟡 phasing decision |
| Virus-scan step for uploads | Quarantine→scan→promote (roadmap) | 🟡 roadmap |
| MFA/TOTP · SSO/SAML/OIDC | Enterprise tier; design hooks now | 🟡 roadmap |

---

## 23. Status & next steps

This document is **🔵 in review**. On approval it becomes the authoritative system architecture and the
input to **Phase 5 — Database** ([DATABASE.md](./DATABASE.md)) and **Phase 6 — API**
([API_SPEC.md](./API_SPEC.md)), which deepen §9 and §8 respectively into implementable specs. No backend
implementation begins until this and the dependent specs are approved (documentation-first, §6 of the
constitution).
