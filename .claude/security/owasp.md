# OWASP

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [SECURITY.md](../../docs/SECURITY.md) (canonical) · all `security/*`

## Purpose
Map OWASP Top 10 to concrete controls in StockFlow.

| OWASP risk | Our controls |
|------------|--------------|
| **A01 Broken Access Control** | Deny-by-default RBAC, server-side checks, object-level + tenant checks, 404 on cross-tenant. See [authorization](./authorization.md), [tenant-isolation](./tenant-isolation.md). |
| **A02 Cryptographic Failures** | TLS everywhere, at-rest encryption, hashed passwords/keys. See [encryption](./encryption.md). |
| **A03 Injection** | Input validation (Zod/DTO), parameterized queries via Mongoose, output encoding, no string-built queries. See [backend/validation](../backend/validation.md). |
| **A04 Insecure Design** | Threat modeling, secure defaults, immutable ledger/audit, documented decisions. |
| **A05 Security Misconfiguration** | Secure headers, least-privilege config, no debug in prod, validated env. See [devops/environments](../devops/environments.md). |
| **A06 Vulnerable Components** | Pinned deps, automated audits (Dependabot/`npm audit`), minimal dependency surface. |
| **A07 Identity/Auth Failures** | Better Auth, secure sessions, rate limiting, lockout, MFA roadmap. See [authentication](./authentication.md). |
| **A08 Software/Data Integrity** | Signed uploads, idempotent jobs, audit log, CI integrity, lockfiles. |
| **A09 Logging/Monitoring Failures** | Structured logs (Pino), Sentry, security-event logging, audit trail. See [backend/logging](../backend/logging.md). |
| **A10 SSRF** | Allow-list outbound calls, validate/normalize URLs, no fetching arbitrary user-supplied URLs server-side. |

## Cross-cutting
Rate limiting, secure headers (CSP, HSTS, X-Content-Type-Options, frame options), CORS allow-list,
CSRF protection on cookie-auth routes, request size limits.
