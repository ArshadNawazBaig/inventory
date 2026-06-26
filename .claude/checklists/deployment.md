# Checklist: Deployment

> **Status:** 🟡 Seed · **Owner:** DevOps · **Related:** [devops/deployment](../devops/deployment.md)

## Pre-deploy
- [ ] CI green (lint, typecheck, tests, build, security scan).
- [ ] DB migrations backward-compatible (expand→migrate→contract) and tested.
- [ ] Env vars/secrets present & validated for target environment.
- [ ] Feature flags configured (risky features off or gated).
- [ ] Docs/Swagger/changelog updated; version tagged.
- [ ] Rollback plan ready (previous image + reverse migration).

## Staging
- [ ] Deployed to staging; smoke + critical E2E pass.
- [ ] Dashboards (errors, latency, queues) healthy.

## Production
- [ ] Approval obtained; zero-downtime rolling deploy.
- [ ] Migrations applied successfully (idempotent).
- [ ] Health/readiness checks pass on all services.

## Post-deploy
- [ ] Sentry error rate normal; p95 latency within target; queue depth/DLQ normal.
- [ ] Key business metrics steady (no drop in core flows).
- [ ] Backups confirmed running. See [devops/backups](../devops/backups.md).
- [ ] Release notes published; stakeholders notified.

## If something's wrong
- [ ] Roll back (redeploy previous image / reverse migration); open incident; fix forward.
