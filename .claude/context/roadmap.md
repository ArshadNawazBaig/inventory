# Roadmap

> **Status:** 🟡 Seed · **Owner:** Product/CTO · **Related:** [PRD §12](../../docs/PRODUCT_REQUIREMENTS.md)

## Delivery phases (engineering process)
1. Documentation → 2. Review → 3. Architecture → 4. Component Design → 5. Database →
6. API → 7. Backend → 8. Frontend → 9. Testing → 10. Documentation Update.

**Current position:** Phase 1 — PRD drafted, awaiting approval.

## Product horizons
| Horizon | Theme | Highlights |
|---------|-------|-----------|
| **Now (v1)** | Core system of record | Catalog, ledger-based inventory, locations, POs, basic SOs/allocations, RBAC, audit, reporting, billing. |
| **Next (v1.x)** | Operator velocity & depth | Lot/serial GA, barcode scanner PWA, cycle counts, advanced valuation/analytics, webhooks & API keys. |
| **Later (v2)** | Ecosystem & enterprise | Integrations (Shopify, QuickBooks/Xero, carriers), SSO/SAML, custom fields, SOC 2, mobile scanner. |
| **Vision (v3+)** | Intelligence & automation | Demand forecasting, multi-currency/global ops, light manufacturing/BOM, automation rules. |

## Module build order (within v1)
Auth & Tenancy → RBAC → Catalog → Locations → Inventory Core (ledger) → Procurement →
Sales/Allocations → Reporting → Billing → Platform polish.
