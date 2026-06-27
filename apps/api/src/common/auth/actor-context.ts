/**
 * The authenticated actor + tenant for a request. Populated from the AuthContext
 * (session/token) once the auth module lands; today provided by the dev guard.
 * Plain interface — no framework imports, so application services can depend on it.
 */
export interface ActorContext {
  organizationId: string;
  actorId: string | null;
}
