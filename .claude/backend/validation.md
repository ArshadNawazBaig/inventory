# Validation

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [dto](./dto.md) · [security/owasp](../security/owasp.md)

## Purpose
Trust nothing from the client. Validate input and validate output.

## Layers of validation
1. **Transport/DTO** — shape, types, required fields, formats (Zod/class-validator). Reject unknown fields.
2. **Domain invariants** — business rules in services (e.g., ATP ≥ 0, valid state transitions).
3. **Persistence** — schema constraints + unique indexes as a backstop.
4. **Output** — Response DTO allow-list (no leaking internal fields).

## Rules
- One Zod schema per contract, shared via `packages/types` (same rules client + server).
- Validate at the boundary via a global validation pipe; fail with structured errors. See [errors](./error-handling.md).
- Sanitize/normalize inputs (trim, case-fold emails); enforce max lengths and array bounds.
- Validate IDs belong to the tenant before acting (no cross-tenant references).
- Reject, don't coerce silently, on ambiguous input.

## Security overlap
Input validation is a primary OWASP control (injection, mass assignment). See [security/owasp](../security/owasp.md).
