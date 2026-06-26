# Encryption

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [secrets](./secrets.md) · [owasp](./owasp.md)

## Purpose
Protect data in transit and at rest.

## In transit
- **TLS everywhere** (HTTPS only); HSTS; modern cipher suites; redirect HTTP→HTTPS.
- Internal service-to-service traffic encrypted where it crosses trust boundaries.

## At rest
- Database and object storage encrypted at rest (platform-managed keys via Railway/Mongo/Cloudinary).
- **Secrets** (API keys, tokens) stored in a secrets manager / env, never in code. See [secrets](./secrets.md).
- Sensitive app-level fields (e.g., integration credentials, API keys) encrypted with a managed
  key before persistence; store only what's necessary.

## Hashing
- Passwords hashed by Better Auth (adaptive algorithm) — never reversible storage.
- API keys and invitation tokens stored **hashed**; show plaintext only once at creation.

## Key management
- Keys are environment-scoped and rotatable; rotation procedure documented.
- No hardcoded keys/IVs; use vetted libraries; never roll custom crypto.

## Rules
- Classify data (public/internal/sensitive/PII) and apply protection accordingly.
- Minimize sensitive data retention; redact in logs (see [backend/logging](../backend/logging.md)).
