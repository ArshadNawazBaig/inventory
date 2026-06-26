# Module Boundaries

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [dependency-rules](./dependency-rules.md) · [backend/nestjs](../backend/nestjs.md)

## Purpose
Define isolated, cohesive modules so changes stay local and teams move independently.

## Principles
- High cohesion within a module; low coupling between modules.
- Modules communicate through **explicit interfaces/ports**, never by reaching into internals.
- Shared kernel only for truly cross-cutting concerns (auth context, tenant context, logging).
- Cross-module side effects go through **domain events** (audit, notifications), not direct calls.

## Bounded contexts (v1)
| Module | Owns | Must not touch |
|--------|------|----------------|
| **Identity & Access** | users, sessions, roles, permissions, memberships | inventory data |
| **Catalog** | products, variants, categories, brands, units | stock quantities |
| **Inventory** | stock ledger, stock levels, reservations, transfers, counts, adjustments | order lifecycle |
| **Locations** | warehouses, zones, bins | catalog |
| **Procurement** | suppliers, purchase orders, receiving | sales |
| **Sales/Fulfillment** | sales orders, allocations, picking/shipping | procurement |
| **Reporting** | read-models, valuation, analytics (read-only) | writes to domain data |
| **Platform** | org settings, billing, notifications, audit, files | domain logic |

## Rules
- A module exposes a public API (service interface) and keeps repositories/schemas private.
- Inventory is the **only** module allowed to write to the stock ledger.
- Reporting reads projections; it never mutates source data.
