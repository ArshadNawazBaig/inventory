# Glossary

> **Status:** 🟡 Seed · **Owner:** Product/CTO · **Related:** [terminology](./terminology.md)

Business and domain terms. For code/naming conventions see [terminology.md](./terminology.md).

| Term | Definition |
|------|------------|
| **Tenant / Organization** | An isolated customer account. All data is scoped by `organizationId`. |
| **Product** | A catalog item; the parent of one or more variants. |
| **Variant** | A specific, sellable/stockable form of a product (e.g., size/color). Carries the SKU. |
| **SKU** | Stock Keeping Unit — unique identifier of a variant within a tenant. |
| **On-hand** | Physical quantity present at a location. A *projection* of the ledger. |
| **Available (ATP)** | Available-to-promise = on-hand − reserved. |
| **Reserved / Allocated** | Stock committed to an order but not yet shipped. |
| **In-transit** | Stock that has left a source location but not yet arrived at destination. |
| **Stock Ledger** | Append-only, immutable record of every stock movement. Source of truth. |
| **Movement** | A single ledger entry (receive, ship, adjust, transfer-out/in, count). |
| **Adjustment** | A manual stock correction, always with a reason code. |
| **Transfer** | Movement of stock between locations (paired out/in movements). |
| **Cycle Count** | Periodic partial physical count to reconcile recorded vs actual stock. |
| **Reorder Point** | Threshold that triggers a low-stock alert / reorder suggestion. |
| **Warehouse / Location / Bin** | Hierarchical place where stock lives (Warehouse → Zone → Bin). |
| **PO (Purchase Order)** | Inbound procurement document from a supplier. |
| **SO (Sales Order)** | Outbound fulfillment document to a customer. |
| **Lot / Batch** | A group of units sharing production/expiry attributes. |
| **Serial** | A uniquely tracked individual unit. |
| **Valuation** | Monetary value of stock (default: weighted-average cost). |
| **Shrinkage** | Loss of stock (damage, theft, error) surfaced via adjustments/counts. |
| **RBAC** | Role-Based Access Control — permissions bundled into roles. |
| **Audit Log** | Immutable record of who did what, when, to which entity. |
