# Monitoring & Observability

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [backend/logging](../backend/logging.md) · [deployment](./deployment.md)

## Purpose
Know what's happening in production — detect, diagnose, and resolve fast.

## Pillars
- **Logs:** structured Pino logs with correlation ids (see [backend/logging](../backend/logging.md)).
- **Errors:** **Sentry** for exceptions (frontend + backend + worker), released by version.
- **Metrics:** latency, throughput, error rate, queue depth, DB performance, resource usage.
- **Product analytics:** **PostHog** for funnels, activation, North Star (movements/active org).

## Health & uptime
- `/health` (liveness) and `/ready` (readiness incl. Mongo/Redis) endpoints per service.
- External uptime checks; status visibility.

## Alerting
- Alert on: error-rate spikes, p95 latency breaches, queue backlog/DLQ growth, failed deploys,
  auth-failure anomalies, low disk/memory, backup failures.
- Alerts are actionable, routed to an on-call owner, with runbook links.

## Rules
- Every release tagged in Sentry for regression attribution.
- Dashboards for system health + key business KPIs.
- Watch dashboards after each deploy (see [deployment](./deployment.md)).
- Security events monitored (permission denials, rate-limit trips) — see [security/audit](../security/audit.md).
