# Product Requirements Document (PRD)

| Field | Value |
|-------|-------|
| **Product (working name)** | StockFlow — Modern Inventory Management SaaS |
| **Document** | Product Requirements Document |
| **Version** | 1.0 (Draft for approval) |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Product / CTO |
| **Date** | 2026-06-26 |
| **Phase** | 1 of the documentation-first delivery process |

---

## 1. Vision

> **To become the inventory system of record that mid-market businesses actually enjoy
> using — combining the correctness and control of an enterprise ERP with the speed,
> clarity, and beauty of a modern productivity tool.**

We believe inventory software has forced a false choice between *powerful* and *pleasant*.
StockFlow eliminates that trade-off. A warehouse operator should be able to receive a
shipment in seconds on a phone; a CFO should be able to trust every number in an audit; an
admin should be able to define exactly who can do what — all inside one fast, beautiful,
multi-tenant platform.

### Market positioning

The inventory space is bifurcated:

- **Legacy ERP-grade** (NetSuite, SAP Business One, Fishbowl) — powerful but slow,
  expensive, and hostile to use.
- **Lightweight SMB tools** (Sortly, inFlow, Zoho Inventory) — pleasant but shallow, with
  weak multi-warehouse, RBAC, and auditability.

Our wedge is the **mid-market gap**: companies that have outgrown spreadsheets and Sortly
but cannot justify a six-figure ERP. Our differentiator is **enterprise-grade correctness
delivered with consumer-grade UX.**

### Three product truths

1. **Stock accuracy is the product.** Every other feature serves "the number on the screen
   equals the number on the shelf." This forces transactional writes, immutable ledgers,
   and reconciliation tooling as first-class concerns.
2. **Inventory is multi-dimensional.** Stock exists at the intersection of
   *product variant × location × lot/serial × status (available / reserved / in-transit /
   damaged)*. Underestimating this dimensionality is the most common failure mode.
3. **It is a system of record, so trust is paramount.** Audit logs, soft deletes, RBAC, and
   tenant isolation are non-negotiable from day one — retrofitting them is nearly impossible.

---

## 2. Goals

### Product goals

- **G1** — Deliver a single source of truth for stock that is accurate, real-time, and fully auditable.
- **G2** — Support multi-warehouse, multi-location operations from a single dashboard.
- **G3** — Make the most frequent operations (receive, pick, count, transfer, adjust) feel effortless.
- **G4** — Provide enterprise-grade access control, tenant isolation, and audit trails by default.
- **G5** — Surface actionable insight (low-stock, reorder, dead stock, valuation) without analyst effort.

### Engineering goals

- **G6** — Ship in small, documented, independently shippable modules (documentation-first).
- **G7** — Maintain a reusable internal design system; no UI built directly in pages.
- **G8** — Achieve enterprise NFRs (security, performance, availability) defined in §10.

---

## 3. Business Objectives

| # | Objective | Target horizon |
|---|-----------|----------------|
| BO-1 | Validate product-market fit in mid-market (10–500 employees) | First 12 months |
| BO-2 | Convert free trial → paid at ≥ 20% | Post-launch quarter |
| BO-3 | Reach net revenue retention (NRR) ≥ 110% via seat + tier expansion | Year 1–2 |
| BO-4 | Keep gross margin ≥ 80% via async/efficient infrastructure | Ongoing |
| BO-5 | Establish auditability/security as a sales differentiator to unlock enterprise deals | Year 2 |
| BO-6 | Build an API/integration ecosystem to increase switching cost | Year 2+ |

**Monetization model:** Subscription tiers (Stripe) — **Free/Trial → Starter → Growth →
Enterprise** — gated by limits (warehouses, users, SKUs, API access) and features (lot/serial
tracking, custom roles, advanced analytics, SSO). Usage metering is instrumented from day one
(BO-4 enabler).

---

## 4. Target Users

**Primary market:** Mid-market product businesses with physical inventory — wholesale/
distribution, light manufacturing, e-commerce/D2C with warehouses, retail chains, 3PLs (later).

### Segments

- **Distributors & wholesalers** — multi-warehouse, high SKU count, purchasing-heavy.
- **E-commerce / D2C brands** — variant-heavy catalogs, fast-moving, integrations-hungry.
- **Light manufacturers** — raw materials → finished goods (future BOM).
- **Field/service businesses** with stock (vans, sites — future mobile).

### Personas

| Persona | Role | Primary jobs-to-be-done | Pain today |
|---------|------|------------------------|-----------|
| **Priya — Operations Director** | Buyer / Champion | Trust the numbers, control access, prove compliance | Spreadsheets, no audit trail, no RBAC |
| **Marco — Inventory/Warehouse Manager** | Power user | Receive, count, transfer, adjust, reorder | Slow tools, manual counts, stockouts |
| **Sam — Warehouse Associate** | High-frequency operator | Scan & pick/receive fast on a device | Clunky, desktop-bound UIs |
| **Dana — Purchasing Manager** | Power user | Raise POs, track receipts, manage suppliers | Disconnected from stock levels |
| **Leo — Finance / Auditor** | Read + report | Valuation, shrinkage, audit logs | No reliable ledger or exportable history |
| **Alex — IT / Org Admin** | Configurer | Provision users, roles, integrations, billing | No granular permissions |

---

## 5. User Roles & RBAC

System (built-in) roles, customizable per tenant via granular permissions. Permissions are
the atomic unit (e.g., `product.create`, `stock.adjust`, `po.approve`, `report.view`,
`settings.manage`, `user.invite`).

| Role | Scope | Description |
|------|-------|-------------|
| **Super Admin** | Platform | StockFlow operator. Manages tenants, plans, platform health. *Not* a customer role. |
| **Organization Owner** | Tenant | Full control, billing ownership, can transfer ownership. One per org (transferable). |
| **Admin** | Tenant | Manage users, roles, settings, all inventory ops. No billing ownership transfer. |
| **Inventory Manager** | Tenant / Warehouse-scoped | Full inventory ops: products, stock, counts, transfers, adjustments. |
| **Purchasing Manager** | Tenant | Suppliers, purchase orders, receiving. |
| **Sales / Fulfillment** | Tenant | Sales orders, allocations, picking, shipping. |
| **Warehouse Staff** | Warehouse-scoped | Execute receive/pick/count/transfer; limited create, no delete/approve. |
| **Viewer / Auditor** | Tenant (read-only) | Read inventory, reports, audit logs. No writes. |
| **Custom Roles** | Tenant | Org-defined bundles of granular permissions (Growth/Enterprise tiers). |

**RBAC principles:** deny-by-default; least privilege; warehouse-level scoping for operators;
every permission check enforced server-side; UI permission state mirrors server truth (never
trusts the client).

---

## 6. Features (capability map)

Tier placement noted where relevant: `[Starter] [Growth] [Enterprise]`.

### A. Catalog
- Products with rich attributes, images (Cloudinary), categories, brands, units of measure.
- Variants (size/color/etc.), per-variant SKU/barcode, pricing (cost & sell).
- Bulk import/export (CSV/XLSX) via async jobs.
- Barcode/QR generation and lookup.

### B. Inventory Core
- Real-time on-hand per variant × location, derived from an immutable **stock ledger**.
- Stock states: available, reserved/allocated, in-transit, damaged/quarantine.
- Stock adjustments with mandatory reason codes.
- Stock transfers between locations (with in-transit state).
- Cycle counts & full physical counts with variance reconciliation.
- Lot/batch & serial tracking `[Growth/Enterprise]`.
- Reorder points, safety stock, low-stock & reorder alerts.

### C. Locations
- Multi-warehouse; hierarchical Warehouse → Zone → Bin (bins optional).
- Per-location stock, defaults, and operator scoping.

### D. Procurement
- Suppliers/vendors with terms, contacts, lead times.
- Purchase Orders: draft → approve → send → partial/full receive → close.
- Receiving against PO updates ledger; cost capture for valuation.

### E. Sales / Outbound
- Sales Orders with stock **allocation/reservation** (prevents double-selling).
- Pick → pack → ship lifecycle; fulfillment updates ledger.
- (Deep order management & invoicing largely out of scope v1 — see §11.)

### F. Reporting & Analytics
- Dashboard: KPIs, stock value, low-stock, movement trends (Recharts).
- Inventory valuation (cost method configurable — default weighted average) `[Growth]`.
- Movement history, shrinkage, dead/slow-moving stock, ABC analysis `[Growth]`.
- Exportable reports (async).

### G. Platform & Admin
- Multi-tenant orgs; org settings & branding (logo via Cloudinary).
- User management, invitations, RBAC & custom roles.
- Audit logs (immutable, filterable, exportable).
- Notifications (in-app + email via Resend): alerts, approvals, digests.
- Billing & subscriptions (Stripe): plans, seats, usage metering, invoices.
- Global search & command palette.
- Light/dark mode, accessible, responsive.

### H. Developer / Integration
- Documented REST API (Swagger). API keys & webhooks `[Growth/Enterprise]`.

---

## 7. Functional Requirements

Numbered for traceability (`FR-<domain>.<n>`). Full acceptance criteria expand in
module-level PRDs.

### Authentication & Tenancy (Better Auth)
- **FR-AUTH.1** — Users sign up, verify email, and create or join an organization.
- **FR-AUTH.2** — Sessions are secure (httpOnly, CSRF-safe), with logout and session revocation.
- **FR-AUTH.3** — All data access is scoped to the active `organizationId`; cross-tenant access is impossible.
- **FR-AUTH.4** — Owner can invite users by email with an assigned role; invites expire.
- **FR-AUTH.5** — SSO/SAML/OIDC `[Enterprise, future]`.

### RBAC
- **FR-RBAC.1** — Every API action validates the actor's permission server-side.
- **FR-RBAC.2** — Admins assign system roles; Growth+ orgs define custom roles from permissions.
- **FR-RBAC.3** — Operator roles can be scoped to specific warehouses.
- **FR-RBAC.4** — UI hides/disables actions the user lacks permission for (mirrors server).

### Catalog
- **FR-CAT.1** — CRUD products with attributes, category, brand, UoM, images, status (active/archived; soft delete).
- **FR-CAT.2** — Manage variants; each variant has a unique SKU and optional barcode (unique per tenant).
- **FR-CAT.3** — Bulk import (CSV/XLSX) validates rows, reports errors per row, runs async, is idempotent.
- **FR-CAT.4** — Generate/print barcodes & QR for variants.

### Inventory Core
- **FR-INV.1** — On-hand quantity per variant × location is computed from the ledger and always reconciles to the sum of movements.
- **FR-INV.2** — Every stock change writes an immutable ledger entry (type, qty Δ, before/after, actor, reason, reference, timestamp).
- **FR-INV.3** — Adjustments require a reason code and optional note; critical writes are transactional (Mongo transactions).
- **FR-INV.4** — Transfers create paired out/in movements with an in-transit state until received.
- **FR-INV.5** — Cycle/physical counts produce variances; approving a count posts reconciling adjustments.
- **FR-INV.6** — Reorder points trigger low-stock alerts and suggested reorder quantities.
- **FR-INV.7** — Lot/serial: movements optionally carry lot/expiry or serial; FEFO/FIFO selection assists picking `[Growth/Enterprise]`.

### Procurement
- **FR-PO.1** — Create POs (supplier, lines, expected date, costs); lifecycle draft→approved→sent→received→closed; cancellable.
- **FR-PO.2** — Approval required above a configurable threshold (`po.approve`).
- **FR-PO.3** — Receiving (full/partial) posts inbound ledger movements and updates cost for valuation.

### Sales / Outbound
- **FR-SO.1** — Create sales orders; allocate/reserve stock against available quantity.
- **FR-SO.2** — Reserved stock is excluded from available-to-promise.
- **FR-SO.3** — Fulfillment (pick→pack→ship) posts outbound movements and releases reservations.

### Reporting
- **FR-RPT.1** — Dashboard shows stock value, low-stock count, recent movements, top KPIs.
- **FR-RPT.2** — Valuation report by weighted-average cost (configurable method) `[Growth]`.
- **FR-RPT.3** — Movement/audit history filterable by product, location, date, actor, type; exportable async.

### Platform
- **FR-PLAT.1** — Immutable audit log records who/what/when for all mutations.
- **FR-PLAT.2** — In-app + email notifications for alerts, approvals, and assignments.
- **FR-PLAT.3** — Stripe-backed plans with seat/usage limits enforced; self-serve upgrade/downgrade; invoices accessible.
- **FR-PLAT.4** — Global search across products, SKUs, POs, SOs, suppliers; command palette for navigation/actions.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | P95 API latency < 300 ms for reads, < 600 ms for writes; dashboard interactive < 2 s; lists virtualized/paginated for 100k+ SKUs. |
| **Scalability** | Horizontal stateless API/worker scaling; async offloading; indexes designed before implementation. |
| **Availability** | 99.9% target; graceful degradation; idempotent jobs; retries with backoff (BullMQ). |
| **Security** | OWASP Top 10 mitigations; RBAC + tenant isolation enforced server-side; input/output validation (Zod/DTO); rate limiting; secure headers; encryption in transit & at rest; secrets never in code; Cloudinary upload type/size validation + signed URLs. |
| **Reliability / Integrity** | Mongo transactions for critical stock ops; immutable ledger & audit log; soft deletes; no destructive in-place edits to history. |
| **Observability** | Structured logging (Pino), error tracking (Sentry), product analytics (PostHog), health checks. |
| **Accessibility** | WCAG 2.1 AA; full keyboard nav; visible focus states; screen-reader labels; color-contrast compliant. |
| **UX** | Responsive (mobile→desktop); light/dark; optimistic UI where safe; consistent design system. |
| **Maintainability** | Clean Architecture, SOLID, DRY, strict TypeScript (no `any`), no disabled lint, modular monorepo. |
| **Compliance / Privacy** | GDPR-aligned data handling, data export & deletion, audit retention policy; SOC 2 readiness as a roadmap goal. |
| **Internationalization** | i18n-ready strings; multi-currency & timezone handling for valuation/timestamps `[phased]`. |
| **Testability** | Unit, integration, E2E, validation, and permission tests required. |

---

## 9. User Stories (representative, with acceptance criteria)

> Format: *As a `<role>`, I want `<capability>`, so that `<value>`.* Full backlog expands per module.

**US-1 — Receive a purchase order** — *As a Warehouse Manager, I want to receive stock against a PO so that on-hand reflects what arrived.*
- AC: Selecting a PO shows expected vs received; partial receipt allowed; receiving posts inbound ledger entries; PO status updates; valuation cost captured; audit log records the action.

**US-2 — Adjust stock with a reason** — *As an Inventory Manager, I want to correct a stock count with a reason so that discrepancies are explained and auditable.*
- AC: Adjustment requires a reason code; before/after quantities recorded; transactional; appears in movement history & audit log; permission `stock.adjust` enforced.

**US-3 — Transfer stock between warehouses** — *As an Inventory Manager, I want to move stock between locations so that supply matches demand.*
- AC: Transfer decrements source, marks in-transit, increments destination on receipt; paired ledger entries; cannot transfer more than available.

**US-4 — Prevent overselling** — *As Sales, I want stock reserved when I create an order so that I don't sell what isn't there.*
- AC: Available-to-promise = on-hand − reserved; creating an SO reserves stock; reservation released on ship or cancel.

**US-5 — Low-stock reorder alert** — *As a Purchasing Manager, I want to be alerted when stock hits its reorder point so that I restock in time.*
- AC: Crossing reorder point triggers in-app + email alert with suggested qty; alert links to PO creation.

**US-6 — Cycle count reconciliation** — *As a Warehouse Manager, I want to run a cycle count so that recorded stock matches physical stock.*
- AC: Count produces per-item variances; approval posts reconciling adjustments to the ledger; full audit trail.

**US-7 — Custom role** — *As an Org Admin, I want to define a custom role so that staff get exactly the access they need.*
- AC: Admin selects granular permissions + warehouse scope; assigning the role immediately changes the user's server-enforced access and UI.

**US-8 — Audit review** — *As an Auditor, I want to filter the audit log so that I can investigate any change.*
- AC: Read-only; filter by actor/date/entity/action; export async; entries immutable.

**US-9 — Onboard organization** — *As a new Owner, I want to set up my org, first warehouse, and invite my team so that we can start fast.*
- AC: Guided onboarding; create org → warehouse → invite users → import products; trial plan provisioned.

**US-10 — Manage subscription** — *As an Owner, I want to upgrade my plan so that I unlock more warehouses/users.*
- AC: Stripe checkout; limits enforced on the new tier; invoice accessible; downgrade respects current usage.

---

## 10. Success Metrics

**North Star Metric:** **Weekly Active Stock Movements** (receives + adjustments + transfers +
fulfillments per active org) — measures whether StockFlow is the real system of record, not a
passive viewer.

| Category | Metric | Target |
|----------|--------|--------|
| Activation | Time-to-first-stock-movement after signup | < 24h for ≥ 60% of new orgs |
| Activation | Onboarding completion (org+warehouse+product+user) | ≥ 70% |
| Engagement | Weekly active orgs / total active | ≥ 50% |
| Engagement | North Star (movements/active org/week) | Growth MoM ≥ 10% early |
| Retention | Logo retention (annual) | ≥ 90% |
| Revenue | Trial → paid conversion | ≥ 20% (BO-2) |
| Revenue | Net revenue retention | ≥ 110% (BO-3) |
| Quality | Stock accuracy (system vs cycle-count) | ≥ 98% |
| Performance | P95 read latency | < 300 ms |
| Reliability | Uptime | ≥ 99.9% |
| Trust / Security | Critical security incidents | 0 |
| Support | Time-to-resolution (P1) | < 4h |

---

## 11. Out of Scope (v1)

Explicitly **not** in the initial release, to protect focus and quality:

- Full accounting/GL, invoicing, payments collection, tax engines.
- Full-blown order management / POS / e-commerce storefront.
- Manufacturing BOM, work orders, MRP, production planning.
- Native mobile apps (PWA/responsive web only in v1; scanner app is roadmap).
- Third-party marketplace/shipping carrier/accounting integrations (Shopify, QuickBooks, etc.).
- AI demand forecasting / auto-replenishment.
- Advanced WMS (wave picking, slotting optimization, automation/robotics).
- Offline mode.
- On-prem/self-hosted deployment.
- Built-in virus scanning (we define the *architecture* for it; actual AV integration is
  roadmap — uploads are validated and quarantined to `temp/` first).

---

## 12. Future Roadmap (indicative, post-v1)

| Horizon | Theme | Highlights |
|---------|-------|-----------|
| **Now (v1)** | Core system of record | Catalog, ledger-based inventory, locations, POs, basic SOs/allocations, RBAC, audit, reporting, billing. |
| **Next (v1.x)** | Operator velocity & depth | Lot/serial tracking GA, barcode scanner PWA, cycle-count workflows, advanced valuation/analytics (ABC, dead stock), webhooks & API keys. |
| **Later (v2)** | Ecosystem & enterprise | Integrations (Shopify, QuickBooks/Xero, carriers), SSO/SAML, custom fields, SOC 2, dedicated-tenant option, mobile scanner app. |
| **Vision (v3+)** | Intelligence & automation | Demand forecasting & auto-replenishment, multi-currency/global ops, light manufacturing/BOM, 3PL/multi-entity, automation rules engine. |

---

## 13. Key Product-Level Architecture Decisions

These shape the PRD; deeper technical architecture follows in Phase 3.

| # | Decision | Rationale |
|---|----------|-----------|
| AD-1 | Multi-tenant SaaS, shared DB with hard tenant scoping (`organizationId` on every collection) | Lowest operational overhead at our scale; isolation enforced at the data-access layer and tested adversarially. |
| AD-2 | Immutable stock ledger as source of truth; on-hand = projection | Stock levels are *derived* from an append-only movement ledger, never edited in place. Guarantees auditability. |
| AD-3 | Product → Variant → Stock model (not flat SKUs) | Real catalogs have variants; a two-level model avoids the flat-SKU dead end. |
| AD-4 | Locations are hierarchical (Warehouse → Zone → Bin), bins optional | Progressive complexity: same schema for a corner shop and an enterprise. |
| AD-5 | RBAC with system roles + custom roles + granular permissions | Permissions are atomic; roles are bundles. Enterprise buyers demand custom roles. |
| AD-6 | Async by default for heavy work (BullMQ) | Imports, exports, reports, emails, webhooks run as background jobs to keep the UI instant. |
| AD-7 | API-first; the web app is just the first client | Every capability ships as a documented REST endpoint, enabling future mobile/scanner apps and integrations. |

---

## 14. Open Questions (require decision before Phase 3)

1. **Product name** — proceed with working name *StockFlow*, or alternative?
2. **Primary launch segment** — confirm distribution/wholesale beachhead, vs e-commerce/D2C first?
3. **Monetization** — seat-based, usage-metered (SKU/order volume), or hybrid (recommended: seats + usage caps per tier)?
4. ~~**Docs location**~~ — **Resolved:** flat `docs/` at repo root with `UPPER_SNAKE_CASE.md` filenames.

---

## 15. Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Product / CTO | | ☐ Approved ☐ Changes requested | |

> Per the documentation-first process, no module proceeds to architecture until this PRD is approved.
