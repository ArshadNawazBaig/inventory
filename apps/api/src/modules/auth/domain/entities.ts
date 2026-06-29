import type { SystemRoleId } from '@stockflow/types';

/**
 * Auth domain entities (framework-free). The model (rbac.md): a global **User** (unique email) joins an
 * **Organization** through a **Membership** that carries the user's roles; a **Session** is an opaque,
 * server-stored credential; an **Invitation** is a single-use, expiring token that adds a new member.
 *
 * Tenant identity is always derived from the Membership/Session server-side — never from the client.
 */

/** A tenant. Created by self-serve signup; its first member is the Owner. */
export interface OrganizationEntity {
  id: string;
  name: string;
  createdAt: Date;
}

/** A person's account. Global and unique by (normalized) email; password is stored only as a hash. */
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Links a user to an organization with one or more roles (the unit RBAC resolves permissions from). */
export interface MembershipEntity {
  id: string;
  organizationId: string;
  userId: string;
  roleIds: SystemRoleId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An authenticated session. `id` is the **SHA-256 of the opaque token** held in the cookie — the raw token is
 * never stored, so a DB leak can't be replayed. Lookups are by this hash; expiry is enforced on read.
 */
export interface SessionEntity {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: Date;
  expiresAt: Date;
}

/** The fully-resolved principal for a request/response — the user, their org, and their membership (roles). */
export interface AuthPrincipal {
  user: UserEntity;
  organization: OrganizationEntity;
  membership: MembershipEntity;
}

export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** A pending membership. `tokenHash` is the SHA-256 of the single-use accept token (emailed in production). */
export interface InvitationEntity {
  id: string;
  organizationId: string;
  email: string;
  roleIds: SystemRoleId[];
  tokenHash: string;
  status: InvitationStatus;
  invitedByUserId: string | null;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt: Date | null;
}
