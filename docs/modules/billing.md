# Billing Module (subscription + plans)

| Field | Value |
|-------|-------|
| **Document** | Billing Design (subscription · plan catalog · usage) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/billing`](../../apps/api/src/modules/billing) · frontend [`apps/web/src/features/billing`](../../apps/web/src/features/billing) |
| **Phase** | Module design + Backend + Frontend (Wave 8) |
| **Depends on** | [catalog/product.md](./product.md) (variant count) · [locations.md](./locations.md) (location count) |
| **Owner** | Principal Architect |

> The per-tenant **subscription** against a fixed **plan catalog**. Payment is abstracted behind a provider
> port — **Stripe** in production, a fake provider until keys + webhooks land. Decisions: **Decision → Why →
> Rejected**.

---

## 1. Scope & boundary
**Owns:** the `Subscription` singleton (per tenant). **Defines:** the `BILLING_PLANS` catalog (product config,
in `@stockflow/types`). **References:** Catalog (`countVariants`) + Locations (`countLocations`) for usage.
One-way; no writes there; no cycles.

---

## 2. Behaviour
`GET /billing/plans` returns the catalog (free · starter · growth · enterprise). `GET /billing/subscription`
returns the tenant subscription or the **free-plan default** if never set (a read has no side effects).
`POST /billing/subscription/change` `{ planId }` moves to a plan via the provider; `POST .../cancel` schedules
cancellation at period end. `GET /billing/usage` reports live counts against the active plan's limits
(`null` = unlimited).

> **Decision** — payment lives behind a **`BillingProviderPort`** with a **fake provider** that activates
> synchronously. **Why** — matches the established ports-and-adapters cadence (Mongoose/Better Auth are
> likewise deferred); the module is fully runnable + testable now, and Stripe drops into the same seam.
> **Rejected** — coupling the application to the Stripe SDK before keys/webhooks exist.

> **Decision** — plans are a **static catalog in `@stockflow/types`** (shared by API + web), not a DB
> collection. **Why** — plans are product config, not tenant data; sharing the contract lets the web render
> cards from the same source. **Rejected** — a per-tenant plans table. Stripe price ids attach server-side
> later.

> **Decision** — expose entitlements via **`BillingQuery.getEntitlements`** but **do not enforce quotas yet**.
> **Why** — the read seam proves the design and is ready for a future Catalog quota check; enforcement is a
> behavioural change worth its own iteration. **Rejected** — blocking variant/location creation in this wave.

---

## 3. API
Base `/api/v1`. `GET /billing/plans` · `GET /billing/subscription` · `GET /billing/usage` (`billing.view`);
`POST /billing/subscription/change` · `POST /billing/subscription/cancel` (`billing.manage`). Tenant-scoped;
`organizationId` from auth, never the body.

---

## 4. Architecture
`BillingService` (plans/subscription/usage over a `SubscriptionRepository` + `BillingProviderPort` + clock,
plus Catalog/Locations read ports bound by identity). `FakeBillingProvider` computes the period from the plan
interval; the controller maps the entity to the response (timestamps → ISO; provider id stays internal).
`BillingQuery.getEntitlements` is the exported entitlements seam. Frontend: a `/billing` page — current-plan
summary (status + period + cancel), a usage panel (bars vs limits), and the plan-catalog grid (switch action).

---

## 5. Testing notes
Service (in-memory repo + fake provider + fixed clock): free default unpersisted on read, change activates with
a computed period + external id, cancel schedules at period end, usage vs limits (incl. unlimited enterprise),
tenant isolation; `BillingQuery.getEntitlements` reflects the active plan. Contracts: catalog validity (every
plan id), enterprise unlimited/custom, change-plan accept/reject, subscription response. Frontend: price/limit/
usage formatters. **Integration (smoke):** plans listed, free default, change → growth (period + status),
usage reflects plan limits, cancel sets `cancelAtPeriodEnd`, tenant isolation, no-tenant 401.

---

## 6. Status
🟢 **Implemented** (Wave 8). Sync `billing.{view,manage}` into AUTHENTICATION §10. Follow-ups: the real
**Stripe provider** (checkout + customer portal + webhooks), quota **enforcement** via `getEntitlements`,
seat-based plans once a members module lands, invoices/payment methods.
