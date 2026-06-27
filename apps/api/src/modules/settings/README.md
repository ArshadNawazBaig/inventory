# Settings module (organization singleton)

The tenant's operational preferences — one document per organization. See
[`docs/modules/settings.md`](../../../../../docs/modules/settings.md).

## Endpoints
- **Get** — `GET /api/v1/settings`. Returns the tenant settings, or safe defaults if never saved (a read has
  no side effects — defaults are not persisted). Permission: `settings.view`.
- **Update** — `PATCH /api/v1/settings`. Partial update; merges onto current-or-default state. Permission:
  `settings.manage`.

## Fields
- `defaultCurrency` (ISO-4217, default `USD`) · `timezone` (IANA label, default `UTC`)
- `allowNegativeStock` (default `false`) — **the policy the Inventory ledger enforces**
- `lowStockAlertsEnabled` (default `true`) — gates low-stock notifications (delivery is a follow-up)

## Layout
```
domain/         entities (the singleton)
application/    ports, settings.service, settings-query (read surface)
infrastructure/ in-memory.repository (one row per tenant)
presentation/   dto, mappers, settings.controller
```

## Cross-module wiring
Settings depends on **nothing** and exports `SettingsQuery`. The **Inventory** module binds its
`InventoryPolicyPort` to `SettingsQuery.allowNegativeStock` (replacing the hardcoded `DefaultInventoryPolicy`),
so negative-stock policy is now tenant-configurable. One-way (Inventory → Settings); no cycle.

## Follow-ups
Org profile (name, logo) once an organizations module lands; member-scoped preferences; more policy keys
(valuation method, reservation policy); low-stock alert delivery (notification fan-out). Permission keys
`settings.{view,manage}` to sync into AUTHENTICATION §10.
