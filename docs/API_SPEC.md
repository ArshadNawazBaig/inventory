# API Specification

| Field | Value |
|-------|-------|
| **Document** | REST API Specification (NestJS / Swagger) |
| **Status** | ⚪ Not started — pending Database approval |
| **Phase** | 6 — API |
| **Depends on** | [DATABASE.md](./DATABASE.md), [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Owner** | Backend Lead |

> This document is reserved. Every endpoint will be documented before implementation.
> The outline below defines its scope.

## Planned contents

- API conventions: versioning, resource naming, pagination, filtering, sorting, errors
- Standard response envelope & error model (codes, messages, validation details)
- AuthN/AuthZ: Better Auth sessions, API keys, permission requirements per endpoint
- Validation pipeline: Request DTO + Zod, Response DTO
- Rate limiting & idempotency keys for mutating endpoints
- Per-endpoint spec template — for **every** endpoint:
  - Method + path, summary, required permission
  - Request DTO, Response DTO
  - Error responses
  - Swagger annotations
- Resource groups: Auth, Organizations, Users & Roles, Catalog (Products/Variants/
  Categories/Brands), Inventory (Stock/Ledger/Adjustments/Transfers/Counts), Locations,
  Suppliers, Purchase Orders, Sales Orders, Reports, Notifications, Billing, Webhooks
- Webhook event catalog & signature scheme
