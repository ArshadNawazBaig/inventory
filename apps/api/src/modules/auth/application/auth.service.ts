import { Inject, Injectable } from '@nestjs/common';
import { permissionsForRoles, type LoginRequest, type RegisterRequest } from '@stockflow/types';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import { UnauthorizedError } from '../../../common/errors';
import type { ResolvedSession } from '../../../common/auth';
import type { AuthPrincipal, SessionEntity } from '../domain/entities';
import { EmailTakenError, InvalidCredentialsError } from '../domain/auth.errors';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  MEMBERSHIP_REPOSITORY,
  ORGANIZATION_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  TOKEN_GENERATOR,
  USER_REPOSITORY,
  type MembershipRepository,
  type OrganizationRepository,
  type PasswordHasher,
  type SessionRepository,
  type TokenGenerator,
  type UserRepository,
} from './ports';

/** Normalize an email for storage + lookup so comparisons are exact (trim + lowercase). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The result of any flow that establishes a session — the principal plus the raw token for the cookie. */
export interface SessionResult {
  principal: AuthPrincipal;
  sessionToken: string;
}

/**
 * Identity + session service. Owns signup, login, logout and session resolution. Passwords are verified through
 * the {@link PasswordHasher} port; sessions are opaque tokens stored only as a SHA-256 hash. The authenticated
 * tenant/actor is derived here server-side and is the only source of identity (authentication.md).
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
    @Inject(AUTH_ID_GENERATOR) private readonly ids: ResourceIdGenerator,
    @Inject(AUTH_CLOCK) private readonly clock: ResourceClock,
    private readonly sessionTtlMs: number,
  ) {}

  /** Self-serve signup: create the organization, its Owner user + membership, and a session. */
  async register(input: RegisterRequest): Promise<SessionResult> {
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) throw new EmailTakenError();

    const now = this.clock.now();
    const organization = await this.organizations.insert({
      id: this.ids.generate(),
      name: input.organizationName.trim(),
      createdAt: now,
    });
    const user = await this.users.insert({
      id: this.ids.generate(),
      email,
      name: input.name.trim(),
      passwordHash: await this.hasher.hash(input.password),
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const membership = await this.memberships.insert({
      id: this.ids.generate(),
      organizationId: organization.id,
      userId: user.id,
      roleIds: ['owner'],
      createdAt: now,
      updatedAt: now,
    });
    const sessionToken = await this.createSession(user.id, organization.id);
    return { principal: { user, organization, membership }, sessionToken };
  }

  /** Verify credentials and open a session for the user's organization. */
  async login(input: LoginRequest): Promise<SessionResult> {
    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user) throw new InvalidCredentialsError();
    if (!(await this.hasher.verify(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    const memberships = await this.memberships.listByUser(user.id);
    const membership = memberships[0];
    if (!membership) throw new UnauthorizedError('Your account is not a member of any organization.');
    const organization = await this.organizations.findById(membership.organizationId);
    if (!organization) throw new UnauthorizedError('Your organization could not be found.');

    const sessionToken = await this.createSession(user.id, organization.id);
    return { principal: { user, organization, membership }, sessionToken };
  }

  /** Revoke a single session (idempotent — an unknown token is a no-op). */
  async logout(token: string): Promise<void> {
    await this.sessions.delete(this.tokens.hash(token));
  }

  /**
   * Resolve a raw cookie token to the request's tenant + actor + effective permissions, or null if the session
   * is missing, expired, or the membership has since been revoked. Expired sessions are pruned on read.
   */
  async authenticate(token: string): Promise<ResolvedSession | null> {
    const session = await this.sessions.findById(this.tokens.hash(token));
    if (!session) return null;
    if (session.expiresAt.getTime() <= this.clock.now().getTime()) {
      await this.sessions.delete(session.id);
      return null;
    }
    const membership = await this.memberships.findByUserAndOrg(session.organizationId, session.userId);
    if (!membership) return null;
    return {
      userId: session.userId,
      organizationId: session.organizationId,
      permissions: permissionsForRoles(membership.roleIds),
    };
  }

  /** Load the full principal for the authenticated request (`GET /auth/me`). */
  async getPrincipal(organizationId: string, userId: string): Promise<AuthPrincipal> {
    const [user, organization, membership] = await Promise.all([
      this.users.findById(userId),
      this.organizations.findById(organizationId),
      this.memberships.findByUserAndOrg(organizationId, userId),
    ]);
    if (!user || !organization || !membership) {
      throw new UnauthorizedError('Your session is no longer valid.');
    }
    return { user, organization, membership };
  }

  /** Mint an opaque session, persist its hash, and return the raw token for the cookie. */
  async createSession(userId: string, organizationId: string): Promise<string> {
    const { token, hash } = this.tokens.generate();
    const now = this.clock.now();
    const session: SessionEntity = {
      id: hash,
      userId,
      organizationId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.sessionTtlMs),
    };
    await this.sessions.insert(session);
    return token;
  }
}
