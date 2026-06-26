# Prompt: Security Review

> **Status:** 🟡 Seed · **Owner:** Security · **Use:** auditing a change/feature for security.

Audit as a Security Engineer against [security/owasp](../security/owasp.md) and all `security/*`.
Assume hostile input and malicious tenants.

## Checklist
- **Access control:** every endpoint has AuthN + explicit permission + tenant check + object-level
  ownership check? Cross-tenant returns 404? See [security/authorization](../security/authorization.md).
- **Tenant isolation:** can user in org A reach org B data via id, filter, search, export, or job
  payload? See [security/tenant-isolation](../security/tenant-isolation.md).
- **Input/output:** validated & whitelisted (no mass assignment); output allow-listed (no leaks)?
- **Injection/SSRF:** no string-built queries; no fetching arbitrary user URLs server-side.
- **Secrets:** none in code/logs/client; env-loaded & validated? See [security/secrets](../security/secrets.md).
- **Crypto/auth:** TLS, hashed passwords/keys, secure sessions, rate limiting/lockout.
- **Uploads:** server-side type/size validation, signed uploads, temp quarantine. See [security/uploads](../security/uploads.md).
- **Audit/logging:** sensitive actions audited; no PII/secrets in logs.
- **Headers/config:** secure headers, CORS allow-list, CSRF, request size limits.

## Output
- Findings rated **Critical / High / Medium / Low** with location + concrete remediation.
- Confirm tenant-isolation and permission tests exist (or write them).
