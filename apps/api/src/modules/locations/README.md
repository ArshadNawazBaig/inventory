# Locations module (Warehouses · Locations)

Physical network for the tenant: **Warehouses** (sites) and **Locations** (a per-warehouse
Warehouse → Zone → … → Bin tree). Stock is tracked at a `locationId`; the materialized `path`
powers subtree roll-ups. See [`docs/modules/locations.md`](../../../../../docs/modules/locations.md)
and DATABASE §5 (ADR-004).

## Shape
- **Warehouse** — on the shared [`common/resource`](../../common/resource) base (like a party): optional
  unique `code`, embedded `address`, and an at-most-one-`isDefault`-per-tenant invariant. Names are not
  unique; restore re-checks the `code`.
- **Location** — **bespoke** (not on the base): `code` is unique *within a warehouse*, names are not
  unique, and the node carries a materialized `path`. It composes the same primitives (id/clock/events) and
  reuses the generic not-found / duplicate errors. A location cannot change warehouses.

## Rules
- Tenant-scoped on every read/write; cross-tenant access returns 404.
- Location parent must be live, in the **same warehouse**, not self, and acyclic (422 otherwise).
- Location `code` unique within its warehouse (409 on collision; case-insensitive).
- Delete is soft; deleting a location with **live children** is refused (409). Stock-in-location guards
  arrive with the Inventory module.
- Changing a location's `code`/parent re-materializes its descendants' `path`.

## Layout
```
domain/         entities, location.errors
application/    ports, warehouse.service, location.service, location-query.service (exported)
infrastructure/ in-memory.repositories
presentation/   dto, mappers, locations.controllers (warehouses + locations)
```

## Ports / adapters
Bound to in-memory adapters until the database module lands. Mongoose adapters implement the same ports
with zero application-layer change (dependency inversion). `LocationQuery` is exported for the Inventory
module to validate stock targets.

## Permissions
`warehouse.{view,manage}`, `location.{view,manage}` — sync into AUTHENTICATION §10.
