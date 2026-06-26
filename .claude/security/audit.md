# Audit (security)

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [database/audit-logs](../database/audit-logs.md)

## Purpose
Security-grade, tamper-evident audit trail of sensitive actions.

## What must be audited
- Auth events: login success/failure, logout, password reset, MFA changes.
- Access-control changes: role/permission edits, member invite/remove, ownership transfer.
- Sensitive data actions: exports, bulk operations, deletions, billing changes.
- All stock-affecting operations (already captured by the immutable ledger).
- API key creation/revocation, integration/webhook changes.

## Properties
- **Immutable & append-only** (see [database/audit-logs](../database/audit-logs.md)).
- Captures actor, action, target, before/after (redacted), ip/userAgent, requestId, timestamp.
- Tenant-scoped; readable only with `audit.view`; exportable with `audit.export`.

## Rules
- Auditing happens server-side, close to the action, and cannot be bypassed by clients.
- Never write secrets/PII into audit payloads (redact).
- Security-relevant denials (permission/tenant violations, rate-limit trips) are recorded.
- Define retention per tenant/compliance; protect logs from modification/deletion.

## Use
Powers compliance (SOC 2 readiness), incident investigation, and the in-app audit viewer.
