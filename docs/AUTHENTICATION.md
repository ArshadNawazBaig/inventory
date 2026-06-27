# Authentication & Access Control

| Field | Value |
|-------|-------|
| **Document** | Authentication, Session Management & Access Control |
| **Status** | 🔵 In review — authored, awaiting approval |
| **Phase** | Cross-cutting (defined with Architecture, enforced throughout) |
| **Depends on** | [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) |
| **Authoritative sources** | [`.claude/security/*`](../.claude/security) (authentication · authorization · permissions · rbac · tenant-isolation · encryption · secrets) |
| **Broader doc** | [SECURITY.md](./SECURITY.md) (threat model / OWASP / uploads / encryption) references this for the auth deep-dive |
| **Owner** | Security Engineer |

> The authoritative design for **who a caller is** (authentication & sessions) and **what they may do**
> (authorization, RBAC, tenant isolation). **Design only — no code.** Every decision is written as
> **Decision → Why → Rejected**. It realizes §13 of [ARCHITECTURE.md](./ARCHITECTURE.md) and binds the
> backend implementation (Phase 7).

---

## 1. Principles & invariants

From [authentication.md](../.claude/security/authentication.md) / [authorization.md](../.claude/security/authorization.md):

1. **Better Auth** is the identity foundation (signup, login, verification, password reset, sessions).
2. **The AuthContext is server-derived per request and is the ONLY source of identity.** Client-provided
   identity, tenant, role, or permission fields are never trusted.
3. **Deny by default.** Access requires an explicit permission; least privilege always.
4. **Authorization = permission check + tenant check + (optional) scope check** — enforced **server-side**;
   the UI mirrors, never replaces, the check.
5. **Cross-tenant access returns 404**, never 403 (no existence leak).
6. **Secrets at rest are hashed/encrypted** — passwords, refresh tokens, API keys, invitation tokens.
7. Security-relevant auth/authz events are **audit-logged** ([§14](#14-auditing-of-auth-events)).

| # | Auth invariant | Enforced by |
|---|----------------|-------------|
| A1 | Identity, org, roles, permissions come only from the server-derived AuthContext | AuthGuard + session/token resolution |
| A2 | The tenant (`organizationId`) is bound to the authenticated session/token, never chosen by the request body | Session `activeOrganizationId` / token `org` claim |
| A3 | Permissions are resolved from **current** role state, never trusted from a token claim | Permission resolver (fresh / short-TTL cache) |
| A4 | Browser credentials are never readable by JavaScript | httpOnly cookies |
| A5 | A stolen long-lived credential is detectable and revocable | refresh-token rotation + reuse detection; server session records |
| A6 | Every privileged action is permission-gated and object-level tenant-checked | RBAC guard + repository tenant scope |

---

## 2. Client taxonomy & the credential decision (the core design choice)

> The single most important authentication decision is **which credential each kind of client uses**. The
> constitution forbids long-lived bearer tokens in the browser; the request also calls for JWT + refresh
> tokens. Both are satisfied by **matching the credential to the client**, not by picking one mechanism for
> everything.

| Client | Credential | Why |
|--------|-----------|-----|
| **First-party web app** (browser) | **Better Auth httpOnly cookie session** (server-side session record, rolling expiry) | A browser has a cookie jar and is exposed to XSS; httpOnly cookies are **unreadable by JS** (A4) and **instantly revocable** server-side. No token sits in `localStorage` to be exfiltrated. |
| **Mobile / native / first-party programmatic** | **Short-lived JWT access token + rotating refresh token** | No cookie jar; needs a bearer credential. A short JWT TTL bounds the stateless-revocation gap; the rotating refresh token gives long-lived sessions with theft detection (A5). |
| **Third-party integrations / M2M / automation** | **Scoped, revocable API keys** (hashed at rest); OAuth2 client-credentials on the Enterprise roadmap | Integrations need stable, narrowly-scoped, individually-revocable credentials independent of any human session. |
| **Stripe / inbound webhooks** | **Signature verification** (not a session at all) | The caller isn't a user; authenticity is proven by HMAC signature ([ARCHITECTURE.md §14](./ARCHITECTURE.md)). |

> **Decision** — **cookies for browsers, JWT+refresh for non-browser first-party clients, API keys for
> integrations** — three edges, one core.
> **Why** — each client class has a different threat model and storage model; forcing one mechanism on all
> of them either weakens the browser (JWT-in-JS = XSS exfiltration) or cripples mobile/integrations (cookies
> don't fit). Crucially, **all three resolve to the same server-derived AuthContext** before any
> authorization decision, so RBAC and tenant isolation are written **once** and are identical regardless of
> how the caller authenticated.
> **Rejected** — (a) JWT-in-`localStorage` for the web app (XSS-exfiltratable, hard to revoke — the classic
> mistake); (b) cookie-only everywhere (mobile/integrations can't carry a first-party cookie cleanly);
> (c) opaque server tokens for mobile (loses the stateless-validation benefit JWT gives edge services).

```
   browser ── cookie session ─┐
   mobile  ── JWT + refresh  ──┤──▶  AuthGuard resolves  ──▶  AuthContext{userId, organizationId,
   API     ── API key        ─┤      (verify credential)        roles, permissions, scope}
   webhook ── HMAC signature ─┘                                        │
                                                          identical RBAC + tenant isolation downstream
```

---

## 3. Better Auth as the foundation

> **Decision** — **Better Auth** owns identity primitives: credential storage, password hashing, email
> verification, password reset, **sessions**, the **organization/membership** primitive (incl.
> `activeOrganizationId` on the session), and pluggable **JWT/bearer**, **API key**, **2FA**, and
> **SSO/OIDC** capabilities. StockFlow's **granular RBAC lives in our domain** (`roles`, `permissions`,
> `memberships` from [DATABASE.md](./DATABASE.md)).
> **Why** — Better Auth is modern, secure-by-default, and standards-based; reusing it avoids hand-rolling
> the most dangerous code in the system (auth). But its built-in role model is **coarse** (a few role
> strings), whereas StockFlow needs a 40+ entry granular permission catalog with warehouse scoping. So we
> draw a clean line: **Better Auth = authentication + session + org-membership; StockFlow = authorization
> (permissions/roles/scope)**. Better Auth tells us *who* and *which org is active*; our RBAC decides *what
> they may do*.
> **Rejected** — building auth from scratch (needless risk), or bending Better Auth's coarse roles to carry
> granular permissions (loses expressiveness, couples authz to the auth library).

**Capabilities we rely on (by concern, not API):** email+password and invitation flows · adaptive password
hashing · server-side session store with revocation · organization plugin (memberships, invitations,
active organization) · JWT issuance with a **JWKS** endpoint for stateless verification · API-key issuance
· 2FA/TOTP and SSO/OIDC (roadmap hooks, [§16](#16-roadmap)).

---

## 4. Authentication flows

### 4.1 Sign-up & email verification
```
register(email, password) ─▶ Better Auth: hash password, create user (status=pending)
   ─▶ send signed, single-use, expiring verification token (email)
   ─▶ user clicks ─▶ verify ─▶ status=active
Sensitive actions are blocked until email is verified.
```

### 4.2 Login (browser → cookie session)
```
login(email, password) ─▶ verify hash (constant-time) ─▶ create session record
   ─▶ Set-Cookie: __Host-session=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/
   ─▶ session carries activeOrganizationId (default = last used / sole membership)
Rate-limited; lockout/backoff on repeated failures (§13).
```

### 4.3 Login (mobile/programmatic → tokens)
```
login(credentials) ─▶ issue access JWT (≈10–15 min) + refresh token (rotating, ≈30 d)
   ─▶ client stores tokens in platform secure storage (Keychain/Keystore), NOT plain storage
```

### 4.4 Password reset
Signed, single-use, expiring token by email → set new password → **revoke all existing sessions/refresh
tokens** (force re-auth everywhere). Audit-logged.

### 4.5 Invitation acceptance (joining an org)
```
admin invites email+roles ─▶ signed, single-use, expiring invitation token
   ─▶ invitee accepts (signs up or logs in) ─▶ membership created (status=active) with invited roles + scope
Invitation tokens are hashed at rest; consumed on first use.
```

### 4.6 Logout & "log out everywhere"
- **Logout** — delete the current session record (cookie) / revoke the presented refresh token (and its
  access token expires shortly after).
- **Log out everywhere** — delete **all** session records and revoke **all** refresh-token families for the
  user. Available to the user and forced by password reset, role downgrade, or suspected compromise.

### 4.7 MFA / SSO (roadmap)
2FA/TOTP and SSO/SAML/OIDC + SCIM are **Enterprise roadmap**; the flows above leave explicit hooks (a
post-password MFA step; an external-IdP login path that still resolves to the same AuthContext) so adding
them later is non-breaking. See [§16](#16-roadmap).

---

## 5. Session management (browser)

### 5.1 Cookie policy
| Attribute | Value | Why |
|-----------|-------|-----|
| `HttpOnly` | yes | JS cannot read the session token (A4) — defeats XSS exfiltration. |
| `Secure` | yes | Sent only over TLS. |
| `SameSite` | `Lax` | Blocks cross-site POST CSRF while allowing top-level navigation; pair with CSRF token for state-changing requests. |
| `__Host-` prefix | yes | Host-only, `Path=/`, no `Domain` — prevents subdomain cookie injection. |
| Lifetime | rolling + absolute cap | See §5.3. |

### 5.2 Server-side session record
The cookie holds an **opaque** token; the authority is a **server-side session record** (managed by Better
Auth): `{ sessionId, hashedToken, userId, activeOrganizationId, createdAt, expiresAt, lastActiveAt, ip,
userAgent, deviceLabel }`.

> **Decision** — server-side session records (opaque cookie), **not** a self-contained JWT in the cookie.
> **Why** — server-side sessions are **instantly revocable** (delete the record) and enumerable (a user can
> see and kill their active devices). That revocability is exactly what stateless JWTs sacrifice — so we
> keep it where it matters most (the long-lived browser session). **Rejected** — JWT-in-cookie (can't be
> revoked before expiry without rebuilding the very server-state we'd be trying to avoid).

### 5.3 Lifetime, refresh & rotation (browser)
- **Rolling expiry** — activity extends `expiresAt` (sliding window, e.g. idle timeout ~7–30 d), bounded by
  an **absolute maximum lifetime** after which re-auth is required regardless of activity.
- **Session-token rotation** — the opaque session token is **re-issued on privilege changes** (login, org
  switch, password change) to prevent **session fixation** (a pre-login token can never become an
  authenticated one).
- **Concurrent sessions** — allowed; each device is its own record, listed and individually revocable.

### 5.4 Revocation triggers
Logout · password reset · role/permission downgrade · member suspension/removal · admin force-logout ·
suspected compromise. Revocation is immediate because the record is checked server-side every request.

### 5.5 CSRF
Cookie-authenticated **state-changing** requests carry a CSRF token (double-submit / synchronizer pattern)
in addition to `SameSite=Lax`. **Bearer/JWT and API-key requests are not CSRF-vulnerable** (no ambient
credential), so CSRF protection applies specifically to the cookie path.

---

## 6. JWT (mobile / programmatic first-party)

### 6.1 Structure & claims
A compact JWT proving **authentication only**:

| Claim | Meaning |
|-------|---------|
| `sub` | userId |
| `org` | active organizationId for this token |
| `sid` | session/lineage id (links to the refresh-token family) |
| `iat`, `exp` | issued-at, short expiry (≈10–15 min) |
| `iss`, `aud` | issuer + audience (StockFlow API) |
| `jti` | unique token id (for optional denylist) |

### 6.2 Signing & verification
> **Decision** — **asymmetric signing (e.g. EdDSA/RS256) with a published JWKS** endpoint; short TTL;
> rotatable keys.
> **Why** — edge/services verify tokens with the **public** key (no shared secret to distribute or leak);
> key rotation is a JWKS update, not a redeploy of every verifier. A short TTL bounds the window in which a
> stolen access token is useful and in which a just-revoked session can still act. **Rejected** — symmetric
> HS256 with a shared secret (every verifier holds a signing-capable secret — larger blast radius), or
> long-lived access tokens (un-revocable for too long).

### 6.3 What JWTs deliberately do NOT carry
> **Decision** — JWTs carry **identity + active org only**; they do **not** embed roles/permissions.
> **Why** — RBAC requires that **role/permission changes take effect immediately** (constitution). If
> permissions were baked into a 15-minute token, a revoked permission would linger until expiry. Instead the
> server resolves permissions from **current** role state per request (A3, [§8.3](#83-permission-resolution--immediacy)). The token answers *who*; the database answers *what they may do, right now*.
> **Rejected** — fat tokens with embedded permissions (stale authorization; the immediacy invariant breaks).

### 6.4 The trade-off, stated plainly
A JWT is valid until `exp` even if the session was revoked a moment ago. We accept this **only** because
the TTL is short, and we mitigate it with: (a) permission resolution from live state (a revoked *permission*
is immediate even if the token is valid), (b) an optional `jti`/`sid` denylist for emergency kill, and
(c) refresh-token revocation that stops renewal within one access-token lifetime.

---

## 7. Refresh tokens (rotation + reuse detection)

```
access JWT expires ─▶ client presents refresh token
   ─▶ server: look up by hash; valid & not used? ─▶ issue NEW access JWT + NEW refresh token
                                                  ─▶ mark old refresh token USED (rotated out)
   ─▶ reuse of an already-rotated token? ─▶ THEFT SUSPECTED
                                          ─▶ revoke the ENTIRE token family + alert + audit + force re-auth
```

| Property | Decision |
|----------|----------|
| Form | High-entropy **opaque** random string (not a JWT) |
| Storage at rest | **Hashed** (e.g. SHA-256); plaintext shown to the client once | 
| Rotation | **One-time use** — every refresh issues a new refresh token and invalidates the prior one |
| Reuse detection | Presenting a rotated-out token ⇒ revoke the **whole family** (lineage) — assume theft |
| TTL | Long, sliding (≈30 d) with an absolute cap; access TTL stays short |
| Binding | Bound to `sid` family; optionally to device fingerprint |

> **Decision** — **rotating refresh tokens with reuse detection (token-family revocation)**.
> **Why** — long-lived sessions for mobile without a long-lived *access* credential. Rotation means a leaked
> refresh token is usable at most until the legitimate client next refreshes — at which point the thief's
> next use (a rotated-out token) trips reuse detection and burns the whole family (A5). Hashing at rest
> means a database leak doesn't yield usable tokens. **Rejected** — static (non-rotating) refresh tokens
> (a single leak grants indefinite access with no detection signal).

---

## 8. The AuthContext & authorization

### 8.1 Resolution (every request)
Realizes the pipeline in [ARCHITECTURE.md §8.1](./ARCHITECTURE.md):
```
credential (cookie | JWT | API key)
  └▶ AuthGuard verifies it ─▶ userId + active organizationId (from session / token / key binding)
       └▶ load membership(userId, organizationId) ─▶ roleIds + warehouseScopeIds
            └▶ resolve roles ─▶ permissionKeys ─▶ AuthContext {
                  userId, organizationId, roles, permissions:Set, scope:{warehouseIds}, actorType }
```
`AuthContext` is attached to the request and is the **only** identity any downstream service, repository,
job, or socket reads (A1).

### 8.2 Authorization decision
```
authorize(required) =
      permission check : required ∈ AuthContext.permissions          (deny by default)
   ∧  tenant check     : target.organizationId == AuthContext.organizationId   (else 404)
   ∧  scope check      : target.warehouseId ∈ AuthContext.scope (if operator is scoped)
```
- Every mutating endpoint **declares its required permission explicitly** (e.g. `@RequirePermission('po.approve')`).
- **Object-level checks**: after loading a record, verify it belongs to the tenant (and scope) before
  acting — defends against IDOR.
- Failures: unauthenticated → 401; missing permission within own tenant → 403; cross-tenant → **404**.

### 8.3 Permission resolution & immediacy
Permissions are resolved from **current** role state (A3). To keep this fast without sacrificing immediacy,
the resolved permission set may be **cached in Redis with a short TTL and explicitly invalidated** whenever
a role, membership, or permission assignment changes for the affected users. A role downgrade therefore
takes effect at the next request — not at token expiry.

> **Decision** — authorization is computed server-side from live role state every request (with explicit
> cache invalidation), independent of how the caller authenticated.
> **Why** — it's the only way to honor "role/permission changes take effect immediately" while staying fast,
> and it means cookie, JWT, and API-key callers are authorized by **identical** logic.

---

## 9. RBAC model

```
Permission (atomic "<resource>.<action>")  ──bundled into──▶  Role (system | custom, optional scope)
Role ──assigned via──▶ Membership (user ↔ organization, roleIds[], warehouseScopeIds[])
Effective permissions = UNION(role.permissionKeys for role in membership.roleIds)  ∩  scope     [deny by default]
```

**System roles** (seeded): Organization Owner · Admin · Inventory Manager · Purchasing Manager ·
Sales/Fulfillment · Warehouse Staff (scoped) · Viewer/Auditor. **Custom roles** (Growth/Enterprise):
built from the permission catalog + warehouse scope.

**Rules** ([rbac.md](../.claude/security/rbac.md)):
- Deny by default; effective permissions = union of roles ∩ scope.
- Role/permission changes are **immediate** and **audit-logged**.
- **Exactly one Owner** per org; ownership transfer is an explicit, audited action.
- Platform **Super Admin** operates the SaaS and is **not** a tenant role (separate console, heightened
  audit; never appears in tenant membership).

> **Decision** — granular permissions bundled into roles, with optional **warehouse scope** on operator
> roles.
> **Why** — enterprises need "view but not adjust", "receive at Warehouse A only" — expressible only with
> granular, scoped permissions. Bundling into roles keeps assignment manageable (no per-user ACL sprawl).
> **Rejected** — coarse fixed roles (can't express least privilege), or per-user permission lists (sprawl,
> unauditable).

---

## 10. Permission catalog

`<resource>.<action>`, lowercase, dot-separated; actions `view/create/update/delete` + domain verbs
(`approve, receive, adjust, transfer, count, allocate, fulfill, export, invite, manage`). The catalog is a
**single constant in `packages/types`**, shared by API + UI (the UI mirrors checks; the API enforces them).

| Domain | Permissions |
|--------|-------------|
| Products | `product.view` `product.create` `product.update` `product.delete` `product.import` |
| Inventory | `stock.view` `stock.adjust` `stock.transfer` `stock.count` |
| Locations | `location.view` `location.manage` |
| Procurement | `supplier.manage` `po.view` `po.create` `po.update` `po.approve` `po.receive` |
| Sales | `so.view` `so.create` `so.update` `so.allocate` `so.fulfill` |
| Reports | `report.view` `report.export` |
| Members | `user.view` `user.invite` `user.update` `user.remove` |
| Roles | `role.view` `role.manage` |
| Billing | `billing.view` `billing.manage` |
| Settings | `settings.view` `settings.manage` |
| Audit | `audit.view` `audit.export` |

> **Rule** — adding a feature means adding its permission(s) here **first**, then gating the endpoint and
> the UI. Permissions may be **scoped** (per warehouse) for operator roles.

---

## 11. Organization isolation

Authentication is where tenant isolation **begins** — the four-layer defense ([tenant-isolation.md](../.claude/security/tenant-isolation.md), [DATABASE.md §10](./DATABASE.md)):

```
① Auth context : organizationId set from the session/token, NEVER from client input (A2)
② Data layer   : base repository auto-scopes every query/write by organizationId
③ Authorization: target.organizationId must equal AuthContext.organizationId (else 404)
④ Responses    : never include cross-tenant references; unknown/foreign id → 404
```

### 11.1 Multi-org users & the active organization
A user may hold memberships in several orgs. The **active organization** is bound to the
session (`activeOrganizationId`) or the token (`org` claim) — **one org per authenticated context at a
time**.

> **Decision** — the active org is part of the **authenticated context**; switching is an **explicit,
> audited** operation that re-mints the session/token (and re-resolves roles for the new org). An endpoint
> **never** reads `organizationId` from the request body to choose the tenant (A2).
> **Why** — if any request could name its own org, a single missing check is a cross-tenant breach. Binding
> the org to the authenticated context means isolation can't be bypassed by parameter tampering, and the
> switch itself is logged. **Rejected** — per-request org selection from input (the classic multi-tenant
> IDOR foot-gun).

### 11.2 Propagation beyond the request
`organizationId` travels with the work: **BullMQ jobs carry it** and scope all reads/writes; **Socket.IO
handshakes resolve it** from the same session and join only room `org:<organizationId>`; **Cloudinary**
assets are foldered per org. Isolation holds on the request path, the work path, and the realtime path
alike.

---

## 12. Credential & token storage at rest

| Secret | At rest | Notes |
|--------|---------|-------|
| Passwords | adaptive hash (Better Auth) | never reversible; constant-time verify |
| Session token | server record holds a **hash**; cookie holds opaque value | revocable |
| Refresh tokens | **hashed** (SHA-256) | rotated, reuse-detected ([§7](#7-refresh-tokens-rotation--reuse-detection)) |
| API keys | **hashed**; plaintext shown once at creation | scoped, revocable |
| Invitation / verification / reset tokens | **hashed**, single-use, expiring | consumed on first use |
| JWT signing key | secret/KMS, **never in code**, rotatable via JWKS | asymmetric |

Per [encryption.md](../.claude/security/encryption.md): TLS everywhere in transit; platform-managed
encryption at rest; no hardcoded keys/IVs; vetted libraries only; no custom crypto; secrets from env/secret
store and **never** logged (redacted).

---

## 13. Brute-force, rate limiting & abuse protection

- **Rate-limit** auth endpoints (login, refresh, reset, invitation) per IP **and** per account.
- **Lockout/backoff** with exponential delay on repeated failures; CAPTCHA/step-up on suspicious volume
  (roadmap).
- **Credential-stuffing** resistance: generic error messages (no "user exists" oracle), breached-password
  checks (roadmap), and anomaly alerts.
- **Enumeration** resistance: signup/reset responses don't reveal whether an email exists.
- Refresh and API-key endpoints rate-limited independently.

---

## 14. Auditing of auth events

Written to the immutable `audit_logs` ([DATABASE.md §15](./DATABASE.md)) — append-only, redacted, tenant-scoped:

- Login success/failure, logout, "log out everywhere"
- Password reset, email verification, MFA enable/disable (roadmap)
- **Refresh-token reuse detection / family revocation** (security-critical)
- Role/permission changes, membership invite/update/remove, **ownership transfer**
- API-key creation/revocation
- Permission/tenant **denials** (security-relevant failures are recorded, not just successes)

Metadata captured: `actorId`, `ip`, `userAgent`, `requestId` — correlating with Pino logs and Sentry.

---

## 15. Threats → mitigations (auth-focused: OWASP A01 & A07)

| Threat | Mitigation |
|--------|------------|
| XSS token theft | httpOnly cookies (browser); tokens never in JS-readable storage (A4) |
| CSRF | `SameSite=Lax` + CSRF token on cookie state-changes; bearer/key paths immune (§5.5) |
| Session fixation | session-token rotation on login/privilege change (§5.3) |
| Credential stuffing / brute force | rate limit + lockout + generic errors (§13) |
| Refresh-token theft | rotation + reuse detection → family revocation (§7) |
| Stolen access token | short JWT TTL + live permission resolution + optional `jti` denylist (§6.4) |
| Privilege escalation | deny-by-default RBAC; server-side checks; immediate revocation (§8–9) |
| Cross-tenant access (IDOR) | four-layer isolation; org bound to context; cross-tenant → 404 (§11) |
| Enumeration | non-revealing signup/reset/login responses (§13) |
| Secret leakage | hashed/encrypted at rest; never in code or logs; rotatable (§12) |

---

## 16. Roadmap

MFA/TOTP & WebAuthn passkeys · SSO (SAML/OIDC) + SCIM provisioning · OAuth2 client-credentials for
integrations · breached-password & device-anomaly detection · step-up auth for high-risk actions
(e.g. ownership transfer, bulk delete). All are **additive** — they resolve to the same AuthContext and
RBAC, so none requires reworking §8–11.

---

## 17. Open decisions (require ratification)

| Topic | Proposal |
|-------|----------|
| Access JWT TTL / refresh TTL | 10–15 min / 30 d sliding (abs. cap) |
| Browser idle vs absolute session lifetime | idle ~14 d, absolute ~90 d |
| Permission-set cache TTL | short (≈30–60 s) with explicit invalidation on role change |
| Step-up auth scope | which actions require re-auth/MFA (ownership transfer, purge, billing) |
| First-party mobile timing | when the JWT/refresh edge ships (web cookie path is v1) |

---

## 18. Status

🔵 **In review.** On approval this binds the backend auth implementation (Phase 7) and is referenced by the
broader [SECURITY.md](./SECURITY.md) (threat model, OWASP, uploads, encryption). The permission catalog
here is the seed for the `packages/types` constant consumed by API + UI.
