# Audit Logs (data layer)

> **Status:** 🟡 Seed · **Owner:** Database Architect · **Related:** [security/audit](../security/audit.md)

## Purpose
An immutable record of who did what, when, to which entity — the backbone of trust.

## Principles
- **Append-only.** No updates, no deletes. Stored in `audit_logs`.
- Written for **every mutation** of domain data (create/update/delete/state-change).
- Captured close to the write (ideally same transaction or guaranteed event) so it cannot be skipped.

## Entry shape (draft)
```
{
  organizationId,
  actorId, actorType,        // user | system | api-key
  action,                    // e.g. "purchase_order.received"
  entityType, entityId,
  before, after,             // diff snapshot (sensitive fields redacted)
  metadata: { ip, userAgent, requestId },
  createdAt
}
```

## Rules
- Redact secrets/PII from `before`/`after`.
- Audit entries reference, never embed, large payloads.
- Retention policy configurable per tenant (default: retain ≥ legally required minimum).
- Stock movements are themselves an audit-grade record; `audit_logs` covers config/permission/order changes too.

## Querying
Indexed for entity trails and actor trails (see [indexes](./indexes.md)); exportable async.
