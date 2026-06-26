# Logging

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [error-handling](./error-handling.md) · [devops/monitoring](../devops/monitoring.md)

## Purpose
Structured, correlated, privacy-safe logs using Pino.

## Rules
- **Structured JSON** logs via Pino; no `console.log` in app code.
- Every request gets a **correlation/request id** propagated through services and into jobs.
- Include context: `requestId`, `organizationId`, `actorId`, `route`, `durationMs`, `statusCode`.
- **Never log secrets or PII** — redact tokens, passwords, card data, emails (configurable redaction).
- Log levels: `error` (actionable failure), `warn` (recoverable/abnormal), `info` (lifecycle),
  `debug` (dev detail, off in prod).
- Errors go to **Sentry** with the same correlation id. See [devops/monitoring](../devops/monitoring.md).

## What to log
- Request start/finish, slow queries, queue job lifecycle, external-call failures, security events
  (auth failures, permission denials, rate-limit hits).

## What not to log
- Full request/response bodies by default; large payloads; anything redacted above.
