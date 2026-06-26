# Deployment

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [github-actions](./github-actions.md) · [railway](./railway.md) · [checklists/deployment](../checklists/deployment.md)

## Purpose
Safe, repeatable releases with fast rollback.

## Flow
1. Merge to `main` → CI builds & pushes images.
2. Auto-deploy to **staging** → run smoke + critical E2E.
3. **Production** deploy gated by approval (and/or version tag).
4. Post-deploy: health verification, monitor error/latency dashboards.

## Principles
- **Immutable images**, promoted across environments (build once, deploy many).
- **Zero-downtime** rolling deploys behind healthchecks.
- **Backward-compatible DB migrations** (expand → migrate → contract); never destructive in one step.
- **Rollback plan** for every release (redeploy previous image; reversible migrations).

## Rules
- Migrations run as a controlled, idempotent step before/with the new version.
- Feature flags for risky features (decouple deploy from release).
- No manual hotfixes on servers — fix forward through the pipeline.
- Deployment runbook + checklist followed each time. See [checklists/deployment](../checklists/deployment.md).

## Observability after deploy
Watch Sentry errors, latency/throughput, queue depth, and key business metrics for regressions.
See [monitoring](./monitoring.md).
