# Project Roadmap

| Field | Value |
|-------|-------|
| **Document** | Delivery Roadmap (v1) |
| **Status** | 🟡 Awaiting approval |
| **Owner** | CTO / Product |
| **Date** | 2026-06-26 |
| **Scope** | StockFlow v1 (system of record). v1.x+ summarized at the end. |
| **Source** | [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) |

> **How to read this.** The work is grouped into **14 phases (P0–P13)**. Each phase has
> **milestones (Mx.y)**; each milestone has **tasks**. Domain phases internally follow our
> documentation-first process (Docs → Database → API → Backend → Frontend → Testing → Docs
> update). Phases are ordered by dependency; the parallelization map and critical path are in
> §"Sequencing".

---

## Guiding sequencing principles

1. **Build the floor before the house.** Tooling, multi-tenancy, RBAC, and the design system
   come before any feature, because retrofitting them is the most expensive mistake.
2. **The ledger is the keystone.** Inventory Core (P6) is the heart; Procurement and Sales are
   *producers of movements* and depend on it.
3. **Cross-cutting concerns are continuous, then gated.** Security, testing, accessibility,
   observability, and documentation are built into every phase *and* re-verified in a dedicated
   hardening phase (P12) before launch.
4. **Each module is independently shippable** behind feature flags, in small iterations.

---

## Phase overview

| Phase | Name | Depends on | Indicative size |
|-------|------|-----------|-----------------|
| **P0** | Foundations & Developer Platform | — | M |
| **P1** | Documentation & Architecture Sign-off | P0 | M |
| **P2** | Design System & Component Library | P1 | L |
| **P3** | Identity, Tenancy & Access Control | P1 (P2 for UI) | L |
| **P4** | Catalog | P3 | L |
| **P5** | Locations | P3 | S |
| **P6** | Inventory Core (Stock Ledger) | P4, P5 | XL |
| **P7** | Procurement | P6 | M |
| **P8** | Sales & Fulfillment | P6 | M |
| **P9** | Reporting & Analytics | P6, P7, P8 | M |
| **P10** | Platform Services (notifications, search, audit UI, settings) | P3, P6 | M |
| **P11** | Billing & Subscriptions | P3 | M |
| **P12** | Hardening (security, performance, a11y, reliability) | all | L |
| **P13** | Launch & Post-Launch | P12 | M |

---

## P0 — Foundations & Developer Platform
**Goal:** A working monorepo, conventions, CI/CD, infra, and observability so every later phase
plugs in cleanly. **Exit:** a trivial build of each app lints, type-checks, tests, and deploys to
staging via CI; logging and error tracking are live.

### M0.1 — Monorepo & tooling
- Initialize repository, `pnpm` workspaces, Turborepo task pipelines.
- Scaffold apps (`web`, `api`, `worker`) and packages (`ui`, `icons`, `hooks`, `types`, `utils`, `config`, `eslint-config`, `tsconfig`).
- Shared **strict** `tsconfig`, shared ESLint config, Prettier.
- Git conventions: branch protection, PR template, CODEOWNERS, conventional commits.
- Pre-commit hooks (lint-staged) + secret scanning (gitleaks).

### M0.2 — Local dev environment
- `docker compose` for MongoDB + Redis under `/infrastructure`.
- Env-var schema + boot-time validation; commit `.env.example` (keys only).
- Seed/factory scaffolding and dev scripts under `/scripts`.

### M0.3 — CI/CD skeleton
- GitHub Actions: install → lint → typecheck → test → build (cached).
- Multi-stage Docker images for `web`/`api`/`worker` (non-root, no baked secrets).
- Railway environments (staging + production); deploy pipeline with a placeholder app.
- `/health` + `/ready` endpoints scaffolded per service.

### M0.4 — Observability baseline
- Pino structured logging + request correlation IDs.
- Sentry wired into web/api/worker; PostHog wired into web.
- Base error model + global exception filter (consistent error envelope).

---

## P1 — Documentation & Architecture Sign-off
**Goal:** Complete and approve the canonical design docs *before* module build (PRD is already
approved). **Exit:** all foundational docs marked 🟢 Approved.

### M1.1 — System architecture
- Author `docs/ARCHITECTURE.md` (system context, layering, monorepo topology, async model, caching, eventing).
- Module boundaries, dependency rules, scalability strategy. → review & approve.

### M1.2 — Database design
- Author `docs/DATABASE.md`: collections, relationships, embed-vs-reference, multi-tenancy, transaction boundaries, audit model.
- Index plan with a justification per index. → approve.

### M1.3 — API standards
- Author `docs/API_SPEC.md` conventions: envelope, naming, pagination, filtering, sorting, errors, versioning, Swagger policy. → approve.

### M1.4 — Security standards & threat model
- Author `docs/SECURITY.md`: STRIDE threat model, authN/Z, tenant isolation, uploads, secrets, encryption, OWASP mapping. → approve.

### M1.5 — Coding & testing standards
- Author `docs/CODING_STANDARDS.md` and the testing strategy. → approve.

---

## P2 — Design System & Component Library
**Goal:** `packages/ui` ready so **no UI is ever built in pages**. **Exit:** components documented,
Storybook published, accessible (axe-clean), themed (light/dark), and unit-tested.

### M2.1 — Design tokens & theming
- Define tokens: color (semantic), typography scale, spacing, radius, shadows, breakpoints, motion, z-index layers.
- Light/dark mappings via Tailwind v4 theme; no-flash theme switching.

### M2.2 — Component tooling
- Storybook + a11y addon; component test harness; visual review setup; CI story build.

### M2.3 — Primitives
- Button, Input, Textarea, Checkbox, Switch, Radio, Slider, Label, Select, Autocomplete.

### M2.4 — Overlays & feedback
- Modal, Drawer, Dialog, Dropdown, Tooltip, Popover, Toast, Command Palette, Loading Skeleton, Empty State, Error State.

### M2.5 — Data & navigation
- Card, Badge, Avatar, Stats Card, Table, Data Grid, Pagination, Tabs, Accordion, Sidebar, Navbar, Breadcrumb.

### M2.6 — Forms, charts & domain components
- Date Picker, Search Bar, Filters, File Upload, Chart wrappers (Recharts).
- Domain: Permission Wrapper, Role Badge, Status Badge.

---

## P3 — Identity, Tenancy & Access Control
**Goal:** The secure multi-tenant foundation everything depends on (PRD FR-AUTH.*, FR-RBAC.*).
**Exit:** a user can sign up, create an org, invite members, and assign roles; tenant isolation
and RBAC are enforced server-side and proven by adversarial tests.

### M3.1 — Module documentation
- Auth, tenancy, and RBAC design docs; permission catalog draft.

### M3.2 — Data layer & tenant scoping
- Collections: `organizations`, `users`, `memberships`, `roles`, `permissions`.
- Base repository that auto-injects `organizationId`; compound tenant indexes.

### M3.3 — Authentication (Better Auth)
- Signup, email verification, login, password reset, secure sessions, logout & session revocation.

### M3.4 — Tenant isolation enforcement
- Tenant-context guard/middleware (org from session, never from input).
- Adversarial cross-tenant tests baked into CI.

### M3.5 — RBAC
- Permission catalog (constants in `packages/types`), system roles, custom roles, warehouse scoping.
- Permission guard + decorators; deny-by-default.

### M3.6 — Onboarding & invitations
- Guided org onboarding; signed, expiring email invitations (Resend).

### M3.7 — Frontend
- Auth pages, authenticated app shell (sidebar/navbar), members & roles management UI, `PermissionWrapper` integration.

### M3.8 — Audit log infrastructure (cross-cutting, established here)
- Immutable `audit_logs`, write pipeline, redaction; foundation for all later auditing.

### M3.9 — Testing
- Unit, integration, **permission**, and **tenant-isolation** suites.

---

## P4 — Catalog
**Goal:** Products, variants, taxonomy, and media (PRD FR-CAT.*). **Exit:** full CRUD with images,
bulk import/export, and barcode lookup; SKU uniqueness enforced per tenant.

### M4.1 — Module docs
### M4.2 — Data layer
- `products`, `variants`, `categories`, `brands`, `units`; indexes (incl. `{organizationId, sku}` unique).
### M4.3 — API
- CRUD for products/variants/taxonomy; DTOs; Swagger; permissions; soft delete/archive.
### M4.4 — Media (Cloudinary)
- Signed uploads, per-org folder structure, server-side type/size validation, temp quarantine, `files` metadata.
### M4.5 — Bulk import/export (async)
- CSV/XLSX import via BullMQ: row validation, per-row error reporting, idempotency; async export.
### M4.6 — Barcodes
- Barcode/QR generation and lookup.
### M4.7 — Frontend
- Product list (TanStack Table; server pagination/filter/sort), product & variant forms (RHF + Zod), media upload UI, import wizard.
### M4.8 — Testing & docs update

---

## P5 — Locations
**Goal:** Multi-warehouse hierarchy (PRD locations). **Exit:** warehouses with optional zones/bins;
operator warehouse-scoping wired into RBAC.

### M5.1 — Module docs
### M5.2 — Data layer
- `warehouses`, `locations` (hierarchy via `parentLocationId`; bins optional); indexes.
### M5.3 — API
- CRUD + hierarchy management; permissions.
### M5.4 — RBAC scoping integration
- Warehouse-scoped operator roles enforced end-to-end.
### M5.5 — Frontend
- Warehouse/location management UI.
### M5.6 — Testing & docs update

---

## P6 — Inventory Core (Stock Ledger) — the keystone
**Goal:** The immutable ledger and everything derived from it (PRD FR-INV.*). **Exit:**
`on-hand == Σ movements` always; `available = on-hand − reserved ≥ 0`; transfers and counts
reconcile; all critical writes transactional and idempotent.

### M6.1 — Module docs
- Ledger model, projection, reconciliation, transaction boundaries, idempotency strategy.
### M6.2 — Data layer
- `stock_movements` (immutable), `stock_levels` (projection), `reservations`; indexes; transaction patterns.
### M6.3 — Adjustments
- Reason-coded adjustments: transactional ledger write + projection update; audit.
### M6.4 — Transfers
- Paired out/in movements with in-transit state; cannot exceed available.
### M6.5 — Reservations / available-to-promise
- Reservation primitive; ATP excludes reserved stock.
### M6.6 — Counts & reconciliation
- Cycle/physical counts → variances → approval posts reconciling movements.
### M6.7 — Reorder & low-stock detection
- Reorder points, safety stock; low-stock evaluation job (BullMQ) emitting alert events.
### M6.8 — Movement history & reconciliation tooling
- Filterable movement history API; ledger-vs-projection reconciliation utility.
### M6.9 — Frontend
- Stock views per variant×location; adjustment/transfer/count workflows; movement history view.
### M6.10 — Testing
- Ledger correctness, atomicity, idempotency (retry ≠ double-post), concurrency/write-conflict handling, negative-stock guard.

---

## P7 — Procurement
**Goal:** Suppliers and inbound flow (PRD FR-PO.*). **Exit:** PO lifecycle with approval and
partial receiving that posts inbound ledger movements and captures cost for valuation.

### M7.1 — Module docs
### M7.2 — Data layer
- `suppliers`, `purchase_orders` (+ embedded lines); indexes.
### M7.3 — API
- Supplier CRUD; PO lifecycle (draft→approved→sent→received→closed; cancel); configurable approval threshold; permissions.
### M7.4 — Receiving
- Full/partial receipt → inbound movements (transactional) + cost capture (valuation input).
### M7.5 — Frontend
- Supplier management; PO creation/approval/receiving UI.
### M7.6 — Testing & docs update

---

## P8 — Sales & Fulfillment
**Goal:** Outbound flow with allocations (PRD FR-SO.*). **Exit:** orders reserve stock (no
overselling); fulfillment posts outbound movements and releases reservations. *Can run in
parallel with P7 (both depend only on P6).*

### M8.1 — Module docs
### M8.2 — Data layer
- `sales_orders` (+ embedded lines); reservation integration; indexes.
### M8.3 — API
- SO lifecycle; allocation/reservation; pick→pack→ship; permissions.
### M8.4 — Fulfillment
- Outbound movements (transactional) + reservation release on ship/cancel.
### M8.5 — Frontend
- SO creation, allocation, and fulfillment UI.
### M8.6 — Testing & docs update
- No-oversell guarantees; reservation release on cancel/ship.

---

## P9 — Reporting & Analytics
**Goal:** Insight without analyst effort (PRD FR-RPT.*). **Exit:** dashboard KPIs, valuation,
movement/audit reports, and async exports. *Depends on P6/P7/P8 data.*

### M9.1 — Module docs (read models, valuation method)
### M9.2 — Read models / aggregation pipelines for dashboard KPIs (stock value, low-stock, movement trends).
### M9.3 — Valuation report (weighted-average; method configurable).
### M9.4 — Analytics reports: movement/audit history, shrinkage, dead/slow-moving, ABC (Growth tier).
### M9.5 — Async report exports (BullMQ).
### M9.6 — Frontend: dashboard (Recharts wrappers), report views, export UI.
### M9.7 — Testing & docs update.

---

## P10 — Platform Services
**Goal:** The connective tissue (PRD FR-PLAT.1/2/4). **Exit:** notifications delivered, global
search + command palette, audit viewer, and org settings/branding shipped. *Notifications infra
may begin during P6 to consume low-stock alert events.*

### M10.1 — Notifications
- In-app + email (Resend); digests; wire low-stock, approval, and assignment events.
### M10.2 — Global search + Command Palette
- Cross-entity search (products, SKUs, POs, SOs, suppliers); palette for nav/actions.
### M10.3 — Audit log viewer
- Filterable, exportable, read-only UI (gated by `audit.view`/`audit.export`).
### M10.4 — Org settings & branding
- Settings UI; logo upload (Cloudinary).
### M10.5 — Testing & docs update.

---

## P11 — Billing & Subscriptions
**Goal:** Monetization with enforced limits (PRD FR-PLAT.3, Stripe). **Exit:** self-serve plans,
metered usage, invoices, and tier/feature enforcement. *Usage events are emitted from earlier
modules as built; this phase wires them to Stripe.*

### M11.1 — Module docs (plans, tiers, limits, metering model).
### M11.2 — Usage metering instrumentation (consume the usage events emitted since P4).
### M11.3 — Stripe integration: plans, checkout, **webhook verification**, invoices.
### M11.4 — Limit & feature-flag enforcement (warehouses/users/SKUs/API; tier gates).
### M11.5 — Frontend: billing UI, upgrade/downgrade, invoice access.
### M11.6 — Testing (webhook integrity, limit enforcement, downgrade-respects-usage) & docs update.

---

## P12 — Hardening: Security, Performance, Accessibility, Reliability
**Goal:** Prove the NFRs before launch (PRD §8). **Exit:** clean security review, performance
within targets, WCAG AA, tested backups/DR, and E2E coverage of critical journeys.

### M12.1 — Security
- Full OWASP pass; adversarial tenant-isolation sweep across every endpoint/job/export; rate limiting; secure headers; dependency audit; pen-test.
### M12.2 — Performance
- Index audit (`explain` on hot paths), load/stress testing, query optimization, Redis caching, frontend bundle/Web-Vitals budgets.
### M12.3 — Accessibility
- App-wide WCAG 2.1 AA audit (automated + keyboard/screen-reader manual passes).
### M12.4 — Reliability
- Backups + **restore drill**, DR runbook, queue/DLQ handling, idempotency review, graceful third-party degradation.
### M12.5 — E2E & resilience
- Playwright coverage of critical journeys; failure-injection testing.
### M12.6 — Documentation sweep (update all `docs/` + `.claude/` to 🟢 as-built).

---

## P13 — Launch & Post-Launch
**Goal:** Ship safely and learn. **Exit:** GA in production with monitoring and a metrics review
loop.

### M13.1 — Pre-launch
- Staging sign-off, data migration tooling, runbooks, on-call rotation, status page.
### M13.2 — Beta / design-partner rollout
- Limited release; structured feedback loop; bug triage.
### M13.3 — GA launch
- Production cutover (zero-downtime), monitoring window, marketing site live.
### M13.4 — Post-launch
- Review against success metrics (activation, North Star, conversion); triage; iterate.

---

## Sequencing

### Critical path
`P0 → P1 → P3 → P4 → P5 → P6 → (P7 ∥ P8) → P9 → P12 → P13`
(P6 Inventory Core is the single most important and longest item — protect its schedule.)

### What can run in parallel
- **P2 (design system)** overlaps **P3+** once tokens and core primitives exist — a dedicated
  UI track can run alongside backend modules.
- **P7 (Procurement) ∥ P8 (Sales)** — both depend only on P6; two teams can split them.
- **P11 (Billing)** is largely independent after P3; backend can progress early, UI lands later.
- **P10 notifications infra** can start during P6 to consume alert events.

### Cross-cutting tracks (continuous, every phase)
Security · Testing (unit/integration/permission/tenant) · Accessibility · Observability ·
Documentation · Usage-metering instrumentation. P12 is the dedicated re-verification gate, not
the first time these are addressed.

> **Estimates.** Sizes (S/M/L/XL) are relative effort, not calendar time — actual duration
> depends on team size and parallelization. Provide team composition and we'll convert this into
> a sprint-by-sprint plan with dates.

---

## Beyond v1 (from PRD §12)
- **v1.x:** lot/serial tracking GA, barcode scanner PWA, advanced valuation/analytics, webhooks & API keys.
- **v2:** integrations (Shopify, QuickBooks/Xero, carriers), SSO/SAML, custom fields, SOC 2, mobile scanner.
- **v3+:** demand forecasting, multi-currency/global ops, light manufacturing/BOM, automation rules engine.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| CTO / Product | ☐ Approved ☐ Changes requested | |
