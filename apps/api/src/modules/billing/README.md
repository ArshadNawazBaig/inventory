# Billing module (subscription + plans)

The tenant's subscription against a fixed plan catalog. Payment is abstracted behind a provider port
(Stripe later; a fake provider now). See [`docs/modules/billing.md`](../../../../../docs/modules/billing.md).

## Endpoints
- **Plans** — `GET /api/v1/billing/plans`. The fixed catalog (free · starter · growth · enterprise) with
  price, interval, limits and features. Permission: `billing.view`.
- **Subscription** — `GET /api/v1/billing/subscription`. The tenant subscription, or the free-plan default if
  never set (no side effects on read). Permission: `billing.view`.
- **Change plan** — `POST /api/v1/billing/subscription/change` `{ planId }`. Goes through the provider, then
  persists. Permission: `billing.manage`.
- **Cancel** — `POST /api/v1/billing/subscription/cancel`. Schedules cancellation at period end. Permission:
  `billing.manage`.
- **Usage** — `GET /api/v1/billing/usage`. Live counts (variants, locations) against the active plan's limits
  (`null` = unlimited). Permission: `billing.view`.

## Layout
```
domain/         entities (the subscription singleton)
application/    ports, billing.service, billing-query (entitlements)
infrastructure/ in-memory.repository, adapters (FakeBillingProvider — the Stripe seam)
presentation/   dto, mappers, billing.controller
```

## Cross-module wiring
Billing depends one-way on Catalog (`countVariants`) and Locations (`countLocations`) for usage — bound by
identity to their query services; no writes, no cycles. It exports `BillingQuery.getEntitlements` (the active
plan's limits) — the seam a future quota check binds to (e.g. Catalog rejecting a new variant past
`maxVariants`).

## Follow-ups
The real **Stripe provider** (checkout session + customer portal + webhooks driving the subscription state);
quota **enforcement** via `BillingQuery.getEntitlements`; seat-based plans once a members module lands;
invoices/payment-method management. Permission keys `billing.{view,manage}` to sync into AUTHENTICATION §10.
