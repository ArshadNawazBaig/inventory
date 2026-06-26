# Railway

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [deployment](./deployment.md) · [environments](./environments.md)

## Purpose
Host StockFlow services on Railway.

## Services
- `web` (Next.js), `api` (NestJS), `worker` (BullMQ consumers).
- Managed/attached **MongoDB** and **Redis** (or external providers) per environment.

## Principles
- One Railway environment per stage: **staging** and **production** (+ ephemeral PR previews optional).
- Deploy from container images built in CI (see [docker](./docker.md), [github-actions](./github-actions.md)).
- Secrets/config set as Railway environment variables — never in repo. See [security/secrets](../security/secrets.md).

## Rules
- Healthchecks gate rollouts; configure restart policies.
- Autoscale stateless services (`api`, `worker`); `worker` scales by queue depth.
- Resource limits set per service; logs/metrics shipped to monitoring. See [monitoring](./monitoring.md).
- Database backups enabled and verified. See [backups](./backups.md).
- Network: only `web`/`api` publicly exposed; `worker` and datastores private.

## Workflow
- CI builds → pushes image → triggers Railway deploy with migrations/seed where needed.
  See [deployment](./deployment.md).
