# Settings Module (organization singleton)

| Field | Value |
|-------|-------|
| **Document** | Settings Design (organization preferences + stock policy) |
| **Status** | 🟢 Implemented — backend [`apps/api/src/modules/settings`](../../apps/api/src/modules/settings) · frontend [`apps/web/src/features/settings`](../../apps/web/src/features/settings) |
| **Phase** | Module design + Backend + Frontend (Wave 8) |
| **Depended on by** | [inventory.md](./inventory.md) (binds its stock policy to `SettingsQuery.allowNegativeStock`) |
| **Owner** | Principal Architect |

> A per-tenant **singleton** (one document per organization) holding operational preferences. Notably it owns
> `allowNegativeStock`, the policy the Inventory ledger enforces. Decisions: **Decision → Why → Rejected**.

---

## 1. Scope & boundary
**Owns:** the `OrganizationSettings` singleton (`defaultCurrency`, `timezone`, `allowNegativeStock`,
`lowStockAlertsEnabled`). **References:** nothing. **Consumed by:** Inventory (policy). One-way; no cycles.

---

## 2. Behaviour
`GET /api/v1/settings` returns the tenant's settings, or **safe defaults** (`USD` / `UTC` / no-negative-stock /
alerts-on) if it has never saved — a read never persists. `PATCH /api/v1/settings` is a partial update
(at least one field) merged onto the current-or-default state, stamping `updatedAt`/`updatedBy`.

> **Decision** — a GET returns **ephemeral defaults** rather than creating a row. **Why** — a read should have
> no side effects; the safe baseline is well-defined and `SettingsQuery` falls back to it anyway. **Rejected** —
> create-on-read (a write on a safe method).

> **Decision** — Settings owns `allowNegativeStock` and **Inventory binds its `InventoryPolicyPort` to
> `SettingsQuery.allowNegativeStock`**, replacing the hardcoded `DefaultInventoryPolicy`. **Why** — the policy
> was always meant to be tenant-configurable (the stub said as much); this makes Settings useful from day one
> and keeps the dependency one-way (Inventory → Settings). **Rejected** — leaving the policy hardcoded;
> duplicating the flag inside Inventory.

---

## 3. API
Base `/api/v1`. `GET /settings` (`settings.view`) · `PATCH /settings` (`settings.manage`). Tenant-scoped;
`organizationId` comes from auth, never the body. `requestId` on every response.

---

## 4. Architecture
`SettingsService` (get/update over an `OrganizationSettingsRepository` + clock) returns the entity; the
controller maps to the response (timestamps → ISO, org id stays implicit). `SettingsQuery` is the read surface
other modules bind to. Frontend: a `/settings` page with a RHF + Zod form — currency + timezone selects and
inventory-policy toggles — saving via a `PATCH` mutation that seeds the cache.

---

## 5. Testing notes
Service (in-memory repo + fixed clock): defaults when unsaved, no-write-on-read, partial merge stamps
`updatedAt`/`updatedBy`, successive partial updates preserve earlier fields, tenant isolation;
`SettingsQuery.allowNegativeStock` defaults false and reflects saves. Contracts: response parse, defaults,
partial-update acceptance, rejects empty patch / bad currency / malformed timezone / unknown fields. Frontend:
form mappers (`toSettingsForm`, `toUpdateRequest` upper-cases currency) + schema. **Integration (smoke):**
toggling `allowNegativeStock` changes real ledger behaviour (an over-ship is rejected, then permitted).

---

## 6. Status
🟢 **Implemented** (Wave 8). Sync `settings.{view,manage}` into AUTHENTICATION §10. Follow-ups: org profile
(name, logo) when an organizations module lands; member-scoped preferences; more policy keys (valuation method,
reservation policy); low-stock alert delivery via the notification fan-out.
