# Swagger / OpenAPI

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [standards](./standards.md) · [backend/dto](../backend/dto.md)

## Purpose
Every endpoint is fully documented via Swagger/OpenAPI — documentation is not optional.

## Rules
- Use NestJS Swagger decorators; the spec is generated from DTOs + decorators (single source).
- **Every endpoint documents:** summary/description, required permission, request DTO, response
  DTO(s), all error responses, and examples.
- Tag endpoints by resource group (Catalog, Inventory, Procurement, …).
- Document auth scheme (session/cookie + API key) and which routes need which.
- Keep DTOs and Swagger in sync automatically — no hand-written drift.

## Quality bar
- Realistic request/response examples for each endpoint.
- Enumerations documented with allowed values (from `packages/types`).
- Pagination/filter/sort query params documented consistently. See [pagination](./pagination.md).
- The generated spec is published (protected) and used for client generation/testing.

## Usage
- Serve interactive docs in non-prod; gate/secure in production.
- The OpenAPI document is the contract the frontend types are validated against.
