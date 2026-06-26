# Relationships

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [collections](./collections.md)

## Purpose
How collections reference each other and when to embed vs reference.

## Embed vs reference
- **Embed** when data is owned, bounded, and always read together (e.g., PO line items within a PO).
- **Reference** when data is shared, unbounded, or independently queried (e.g., product ↔ variants).
- Never embed unbounded growth (movements, audit entries, large arrays).

## Core relationships
```
Organization 1───* Membership *───1 User
Organization 1───* Role        *───* Permission (role holds permission keys)
Product      1───* Variant
Category/Brand/Unit 1───* Product (reference)
Warehouse    1───* Location (hierarchy: parentLocationId, optional bins)
Variant ×Location 1───1 StockLevel (projection)
Variant ×Location 1───* StockMovement (immutable history)
PurchaseOrder 1───* POLine (embedded)  ─receives→ StockMovement
SalesOrder    1───* SOLine  (embedded)  ─reserves→ Reservation ─ships→ StockMovement
Transfer 1───2 StockMovement (out + in)
Count    1───* CountLine ─approve→ StockMovement (adjustments)
```

## Denormalization (deliberate, kept in sync via events)
- Store `sku`/product name snapshots on order lines for historical accuracy.
- Maintain `stock_levels` as a projection of `stock_movements` (reconcilable).
