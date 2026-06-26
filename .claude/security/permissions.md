# Permissions

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [rbac](./rbac.md) · [authorization](./authorization.md)

## Purpose
The atomic permission catalog. Permissions are the unit; roles are bundles of permissions.

## Naming
`<resource>.<action>` — lowercase, dot-separated. Actions: `view`, `create`, `update`, `delete`,
plus domain verbs (`approve`, `receive`, `adjust`, `transfer`, `count`, `export`, `invite`, `manage`).

## Seed catalog (illustrative — finalized with API)
| Domain | Permissions |
|--------|-------------|
| Products | `product.view` `product.create` `product.update` `product.delete` `product.import` |
| Inventory | `stock.view` `stock.adjust` `stock.transfer` `stock.count` |
| Locations | `location.view` `location.manage` |
| Procurement | `supplier.manage` `po.view` `po.create` `po.update` `po.approve` `po.receive` |
| Sales | `so.view` `so.create` `so.update` `so.allocate` `so.fulfill` |
| Reports | `report.view` `report.export` |
| Members | `user.view` `user.invite` `user.update` `user.remove` |
| Roles | `role.view` `role.manage` |
| Billing | `billing.view` `billing.manage` |
| Settings | `settings.view` `settings.manage` |
| Audit | `audit.view` `audit.export` |

## Rules
- The catalog is a single constant in `packages/types`, shared by API + UI.
- Adding a feature → add its permissions here first, then gate endpoints and UI.
- Permissions can be **scoped** (e.g., per warehouse) for operator roles.
