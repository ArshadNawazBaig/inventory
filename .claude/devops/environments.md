# Environments

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [security/secrets](../security/secrets.md) · [deployment](./deployment.md)

## Purpose
Clear separation and configuration of runtime environments.

## Environments
| Env | Purpose | Data |
|-----|---------|------|
| **local** | Developer machines (docker compose) | Disposable seed data |
| **test/CI** | Automated tests | Ephemeral Mongo/Redis |
| **staging** | Pre-prod validation, smoke tests | Prod-like, non-real data |
| **production** | Live customers | Real data, backups, monitoring |

## Config & secrets
- All config via **validated environment variables** (fail-fast at boot).
- Distinct secrets per environment; least privilege. See [security/secrets](../security/secrets.md).
- Commit `.env.example` (keys only); never commit real `.env*`.
- Frontend: only `NEXT_PUBLIC_*` is exposed to the browser — never put secrets there.

## Required variables (illustrative)
`MONGODB_URI`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_*`, `STRIPE_*`, `RESEND_API_KEY`,
`SENTRY_DSN`, `POSTHOG_KEY`, `APP_URL`, `API_URL`.

## Rules
- No environment-specific code branches beyond config; behavior driven by config, not hardcoding.
- Parity: staging mirrors production as closely as possible.
- Document each variable (purpose, required?, default) in `config` package / README.
