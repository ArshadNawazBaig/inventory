import type { SystemRoleId } from '@stockflow/types';
import type {
  InvitationEntity,
  MembershipEntity,
  OrganizationEntity,
  SessionEntity,
  UserEntity,
} from '../domain/entities';

/**
 * Persistence + crypto ports for the auth module. Every concrete adapter (in-memory or Mongoose) implements
 * these without the application layer knowing which driver is active. Email is normalized (trim + lowercase)
 * by the service before it reaches a repository, so lookups are exact.
 */

export interface OrganizationRepository {
  insert(organization: OrganizationEntity): Promise<OrganizationEntity>;
  findById(id: string): Promise<OrganizationEntity | null>;
}

export interface UserRepository {
  insert(user: UserEntity): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  /** By normalized email — the credential lookup; global (a user can belong to many orgs). */
  findByEmail(email: string): Promise<UserEntity | null>;
}

export interface MembershipRepository {
  insert(membership: MembershipEntity): Promise<MembershipEntity>;
  findById(organizationId: string, id: string): Promise<MembershipEntity | null>;
  findByUserAndOrg(organizationId: string, userId: string): Promise<MembershipEntity | null>;
  listByUser(userId: string): Promise<MembershipEntity[]>;
  listByOrg(organizationId: string): Promise<MembershipEntity[]>;
  /** Count active memberships in the org holding the given role (used to protect the last Owner). */
  countByRole(organizationId: string, roleId: SystemRoleId): Promise<number>;
  update(organizationId: string, id: string, patch: Partial<MembershipEntity>): Promise<MembershipEntity | null>;
  delete(organizationId: string, id: string): Promise<boolean>;
}

export interface SessionRepository {
  insert(session: SessionEntity): Promise<SessionEntity>;
  /** By the token hash (the session `id`). */
  findById(id: string): Promise<SessionEntity | null>;
  delete(id: string): Promise<boolean>;
  /** Revoke every session for a user ("log out everywhere"). */
  deleteByUser(userId: string): Promise<number>;
}

export interface InvitationRepository {
  insert(invitation: InvitationEntity): Promise<InvitationEntity>;
  findByTokenHash(tokenHash: string): Promise<InvitationEntity | null>;
  findPendingByOrgAndEmail(organizationId: string, email: string): Promise<InvitationEntity | null>;
  listPendingByOrg(organizationId: string): Promise<InvitationEntity[]>;
  update(id: string, patch: Partial<InvitationEntity>): Promise<InvitationEntity | null>;
}

/** Adaptive password hashing (interim: scrypt; Better Auth owns this in production). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
}

/** Opaque token minting for sessions + invitations — returns the raw token and its storable SHA-256 hash. */
export interface TokenGenerator {
  generate(): { token: string; hash: string };
  hash(token: string): string;
}

// ─── DI tokens (framework-agnostic symbols; wired in auth.module.ts) ──────────────
export const ORGANIZATION_REPOSITORY = Symbol('OrganizationRepository');
export const USER_REPOSITORY = Symbol('UserRepository');
export const MEMBERSHIP_REPOSITORY = Symbol('MembershipRepository');
export const SESSION_REPOSITORY = Symbol('SessionRepository');
export const INVITATION_REPOSITORY = Symbol('InvitationRepository');
export const PASSWORD_HASHER = Symbol('PasswordHasher');
export const TOKEN_GENERATOR = Symbol('TokenGenerator');
export const AUTH_ID_GENERATOR = Symbol('AuthIdGenerator');
export const AUTH_CLOCK = Symbol('AuthClock');
