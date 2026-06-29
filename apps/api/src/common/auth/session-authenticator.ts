/**
 * The seam between the framework-level {@link AuthGuard} (which lives in `common`) and the auth module (which
 * implements it). `common` owns the contract; the auth module binds {@link SESSION_AUTHENTICATOR} to its
 * `AuthService`. This keeps the dependency direction clean — `common` never imports a feature module.
 */

/** The tenant + actor + effective permissions resolved from a session token. */
export interface ResolvedSession {
  userId: string;
  organizationId: string;
  permissions: string[];
}

/** Resolves an opaque session token to its {@link ResolvedSession}, or null when invalid/expired/revoked. */
export interface SessionAuthenticator {
  authenticate(token: string): Promise<ResolvedSession | null>;
}

/** DI token the guard injects; bound to the auth module's `AuthService`. */
export const SESSION_AUTHENTICATOR = Symbol('SessionAuthenticator');
