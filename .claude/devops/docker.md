# Docker

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [railway](./railway.md) · [deployment](./deployment.md)

## Purpose
Reproducible, secure container builds for `web`, `api`, and `worker`.

## Principles
- **Multi-stage builds**: deps → build → slim runtime; ship only what's needed.
- Small, secure base images (e.g., `node:<lts>-slim`/distroless-style); pinned versions.
- One image per deployable app; shared packages built from the monorepo context.

## Rules
- Run as a **non-root** user; read-only filesystem where possible.
- **No secrets baked into images** — inject at runtime via env. See [security/secrets](../security/secrets.md).
- Leverage layer caching (lockfile install before source copy); `.dockerignore` excludes node_modules, .env, tests.
- Pin base image digests; rebuild on dependency/security updates.
- Healthcheck endpoints defined; expose only required ports.
- Deterministic installs (frozen lockfile).

## Local dev
- `docker compose` for Mongo + Redis (+ optional services) under `/infrastructure`.
- Dev vs prod Dockerfiles/targets clearly separated.
