import { Inject, Injectable } from '@nestjs/common';
import type {
  AcceptInvitationRequest,
  InviteMemberRequest,
  MemberStatus,
  SystemRoleId,
  UpdateMemberRolesRequest,
} from '@stockflow/types';
import type { ActorContext } from '../../../common/auth';
import { ValidationError } from '../../../common/errors';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import type { InvitationEntity } from '../domain/entities';
import {
  EmailTakenError,
  InvalidInvitationError,
  InvitationExistsError,
  LastOwnerError,
  MemberNotFoundError,
} from '../domain/auth.errors';
import { AuthService, normalizeEmail, type SessionResult } from './auth.service';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  INVITATION_REPOSITORY,
  MEMBERSHIP_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  TOKEN_GENERATOR,
  USER_REPOSITORY,
  type InvitationRepository,
  type MembershipRepository,
  type PasswordHasher,
  type SessionRepository,
  type TokenGenerator,
  type UserRepository,
} from './ports';

/** A row in the org's people list — an active membership or a pending invitation (framework-free view). */
export interface MemberView {
  id: string;
  userId: string | null;
  email: string;
  name: string | null;
  roleIds: SystemRoleId[];
  status: MemberStatus;
  createdAt: Date;
}

/** The created invitation plus the raw token + accept URL (returned now; emailed in production). */
export interface InviteResult {
  invitation: InvitationEntity;
  token: string;
  acceptUrl: string;
}

/** Owner is established at signup / via ownership transfer (a follow-up) — never granted through invite/assign. */
function rejectOwnerAssignment(roleIds: readonly SystemRoleId[]): void {
  if (roleIds.includes('owner')) {
    throw new ValidationError('The Owner role cannot be assigned to other members.');
  }
}

/**
 * Member management: the org's people list, invitations, role assignment and removal. All operations are
 * tenant-scoped to the actor's organization. RBAC changes take effect immediately — removing a member also
 * revokes their sessions (rbac.md §Rules).
 */
@Injectable()
export class MemberService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
    @Inject(AUTH_ID_GENERATOR) private readonly ids: ResourceIdGenerator,
    @Inject(AUTH_CLOCK) private readonly clock: ResourceClock,
    private readonly auth: AuthService,
    private readonly invitationTtlMs: number,
    private readonly webBaseUrl: string,
  ) {}

  /** The people list: active memberships (with their user) followed by pending invitations. */
  async listMembers(actor: ActorContext): Promise<MemberView[]> {
    const memberships = await this.memberships.listByOrg(actor.organizationId);
    const active = await Promise.all(
      memberships.map(async (membership): Promise<MemberView> => {
        const user = await this.users.findById(membership.userId);
        return {
          id: membership.id,
          userId: membership.userId,
          email: user?.email ?? '',
          name: user?.name ?? null,
          roleIds: membership.roleIds,
          status: 'active',
          createdAt: membership.createdAt,
        };
      }),
    );
    const pending = await this.invitations.listPendingByOrg(actor.organizationId);
    const invited = pending.map(
      (invitation): MemberView => ({
        id: invitation.id,
        userId: null,
        email: invitation.email,
        name: null,
        roleIds: invitation.roleIds,
        status: 'invited',
        createdAt: invitation.createdAt,
      }),
    );
    return [...active, ...invited];
  }

  /** Invite a person to the active organization. Fails if they already have an account or a pending invite. */
  async invite(actor: ActorContext, input: InviteMemberRequest): Promise<InviteResult> {
    rejectOwnerAssignment(input.roleIds);
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) throw new EmailTakenError();
    if (await this.invitations.findPendingByOrgAndEmail(actor.organizationId, email)) {
      throw new InvitationExistsError();
    }

    const now = this.clock.now();
    const { token, hash } = this.tokens.generate();
    const invitation = await this.invitations.insert({
      id: this.ids.generate(),
      organizationId: actor.organizationId,
      email,
      roleIds: input.roleIds,
      tokenHash: hash,
      status: 'pending',
      invitedByUserId: actor.actorId,
      expiresAt: new Date(now.getTime() + this.invitationTtlMs),
      createdAt: now,
      acceptedAt: null,
    });
    const acceptUrl = `${this.webBaseUrl}/accept-invite?token=${token}`;
    return { invitation, token, acceptUrl };
  }

  /** Accept an invitation: create the user account, join the org with the invited roles, and open a session. */
  async acceptInvitation(input: AcceptInvitationRequest): Promise<SessionResult> {
    const invitation = await this.invitations.findByTokenHash(this.tokens.hash(input.token));
    const now = this.clock.now();
    if (
      !invitation ||
      invitation.status !== 'pending' ||
      invitation.expiresAt.getTime() <= now.getTime()
    ) {
      throw new InvalidInvitationError();
    }
    if (await this.users.findByEmail(invitation.email)) throw new EmailTakenError();

    const user = await this.users.insert({
      id: this.ids.generate(),
      email: invitation.email,
      name: input.name.trim(),
      passwordHash: await this.hasher.hash(input.password),
      emailVerifiedAt: now, // accepting a mailed invite proves control of the address
      createdAt: now,
      updatedAt: now,
    });
    const membership = await this.memberships.insert({
      id: this.ids.generate(),
      organizationId: invitation.organizationId,
      userId: user.id,
      roleIds: invitation.roleIds,
      createdAt: now,
      updatedAt: now,
    });
    await this.invitations.update(invitation.id, { status: 'accepted', acceptedAt: now });

    const organization = await this.auth.getPrincipal(invitation.organizationId, user.id);
    const sessionToken = await this.auth.createSession(user.id, invitation.organizationId);
    return { principal: { user, organization: organization.organization, membership }, sessionToken };
  }

  /** Replace a member's roles. Cannot assign Owner, nor demote the last Owner. */
  async updateRoles(
    actor: ActorContext,
    membershipId: string,
    input: UpdateMemberRolesRequest,
  ): Promise<MemberView> {
    rejectOwnerAssignment(input.roleIds);
    const membership = await this.memberships.findById(actor.organizationId, membershipId);
    if (!membership) throw new MemberNotFoundError();
    await this.assertNotLastOwner(actor.organizationId, membership.roleIds);

    const updated = await this.memberships.update(actor.organizationId, membershipId, {
      roleIds: input.roleIds,
      updatedAt: this.clock.now(),
    });
    if (!updated) throw new MemberNotFoundError();
    // Roles changed → drop existing sessions so the new permissions apply immediately.
    await this.sessions.deleteByUser(updated.userId);

    const user = await this.users.findById(updated.userId);
    return {
      id: updated.id,
      userId: updated.userId,
      email: user?.email ?? '',
      name: user?.name ?? null,
      roleIds: updated.roleIds,
      status: 'active',
      createdAt: updated.createdAt,
    };
  }

  /** Remove a member from the organization and revoke their sessions. Cannot remove the last Owner. */
  async removeMember(actor: ActorContext, membershipId: string): Promise<void> {
    const membership = await this.memberships.findById(actor.organizationId, membershipId);
    if (!membership) throw new MemberNotFoundError();
    await this.assertNotLastOwner(actor.organizationId, membership.roleIds);

    await this.memberships.delete(actor.organizationId, membership.id);
    await this.sessions.deleteByUser(membership.userId);
  }

  /** Guard: a membership that currently holds Owner cannot be changed if it is the only Owner left. */
  private async assertNotLastOwner(organizationId: string, currentRoleIds: SystemRoleId[]): Promise<void> {
    if (!currentRoleIds.includes('owner')) return;
    if ((await this.memberships.countByRole(organizationId, 'owner')) <= 1) {
      throw new LastOwnerError();
    }
  }
}
