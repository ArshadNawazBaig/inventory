# Checklist: Security

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [prompts/security-review](../prompts/security-review.md) · [security/owasp](../security/owasp.md)

## Access control
- [ ] AuthN required; explicit permission per endpoint; deny-by-default.
- [ ] Object-level ownership + tenant check before acting.
- [ ] Cross-tenant access → 404 (no existence leak).
- [ ] UI permission gates mirror (never replace) server checks.

## Tenant isolation
- [ ] All queries/writes/jobs/exports/search scoped by `organizationId` (from auth, not input).
- [ ] Adversarial cross-tenant tests pass. See [security/tenant-isolation](../security/tenant-isolation.md).

## Input / output
- [ ] Input validated & whitelisted (no mass assignment); output allow-listed.
- [ ] No string-built queries (injection); no server-side fetch of arbitrary user URLs (SSRF).

## Secrets & crypto
- [ ] No secrets in code/logs/client; env-loaded & validated.
- [ ] TLS enforced; passwords/keys hashed; sensitive fields encrypted at rest.

## Uploads
- [ ] Server-side type/size validation; signed uploads; temp quarantine; safe storage keys.

## Logging & audit
- [ ] Sensitive actions audited (immutable); no PII/secrets in logs.
- [ ] Security events logged (auth failures, permission denials, rate-limit trips).

## Config
- [ ] Secure headers, CORS allow-list, CSRF, rate limiting, request size limits.
- [ ] Dependencies audited; no known critical vulns.
