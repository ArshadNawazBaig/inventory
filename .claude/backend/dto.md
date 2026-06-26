# DTOs

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [validation](./validation.md) · [api/standards](../api/standards.md) · [frontend/forms](../frontend/forms.md)

## Purpose
Explicit, validated boundaries for every request and response.

## Rules
- **Every endpoint** has a Request DTO and a Response DTO — no raw bodies, no entity leakage.
- DTOs/Zod schemas live in `packages/types` so frontend and backend share one contract.
- Request DTOs validate and **whitelist** fields (no mass assignment); unknown fields rejected.
- Response DTOs are explicit allow-lists — never serialize a Mongoose document directly
  (prevents leaking internal/sensitive fields).
- `organizationId`, `createdBy`, audit fields, and IDs are server-derived — never accepted from input.
- Money as integer minor units + currency; dates as ISO-8601 UTC.

## Conventions
- Naming: `CreateProductRequest`, `ProductResponse`, `ListProductsQuery`.
- Pagination/filter/sort query DTOs follow [api/pagination](../api/pagination.md) and [api/filtering](../api/filtering.md).
- Map domain → Response DTO via explicit mappers (no implicit spread of entities).
