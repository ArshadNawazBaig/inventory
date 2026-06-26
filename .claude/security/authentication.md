# Authentication

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [SECURITY.md](../../docs/SECURITY.md) (canonical) · [authorization](./authorization.md) · [secrets](./secrets.md)

## Purpose
Verify identity securely using Better Auth.

## Principles
- Use **Better Auth** for signup, login, email verification, password reset, sessions.
- Sessions are **httpOnly, Secure, SameSite** cookies; CSRF-protected; short-lived with refresh.
- Support session revocation and "log out everywhere".

## Rules
- Passwords hashed with a strong adaptive algorithm (handled by Better Auth) — never store plaintext.
- Enforce email verification before sensitive actions.
- Rate-limit auth endpoints; lockout/backoff on repeated failures. See [owasp](./owasp.md).
- Invitations are signed, single-use, expiring tokens.
- MFA/TOTP and SSO/SAML/OIDC are roadmap (Enterprise) — design hooks now, don't block v1.
- Auth context (userId, organizationId, roles/permissions) is derived server-side per request
  and is the **only** source of identity — never trust client-provided identity fields.

## Sessions & tokens
- No long-lived bearer tokens in the browser; API keys (for integrations) are separate, scoped,
  revocable, and hashed at rest.
