# Secrets Management

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [encryption](./encryption.md) · [devops/environments](../devops/environments.md)

## Purpose
Keep credentials out of code and out of reach.

## Hard rules
- **No secrets in code, ever** — not in source, configs, fixtures, tests, or client bundles.
- Secrets come from environment variables / the platform secret store (Railway), loaded and
  **validated at boot** (fail fast if missing). See [devops/environments](../devops/environments.md).
- `.env*` files are git-ignored; commit a `.env.example` with keys but **no values**.
- Frontend env vars are public by definition — never put secrets in `NEXT_PUBLIC_*`.

## Handling
- Distinct secrets per environment (dev/staging/prod); least-privilege scopes.
- Rotate on exposure or schedule; rotation steps documented.
- Never log secrets; redact in logs and errors (see [backend/logging](../backend/logging.md)).
- Third-party secrets (Stripe, Cloudinary, Resend, Mongo, Redis, Sentry, PostHog) live only in
  the server/worker environment.

## Detection
- Secret-scanning in CI (e.g., gitleaks) blocks commits containing credentials.
- Pre-commit hook to catch accidental secret staging.
