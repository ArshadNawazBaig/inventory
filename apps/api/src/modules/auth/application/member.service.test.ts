import { beforeEach, describe, expect, it } from 'vitest';
import { INVENTORY_PERMISSIONS, BILLING_PERMISSIONS } from '@stockflow/types';
import type { ActorContext } from '../../../common/auth';
import { ValidationError } from '../../../common/errors';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import {
  InMemoryInvitationRepository,
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../infrastructure/in-memory.repositories';
import { CryptoTokenGenerator, ScryptPasswordHasher } from '../infrastructure/adapters';
import {
  EmailTakenError,
  InvalidInvitationError,
  InvitationExistsError,
  LastOwnerError,
  MemberNotFoundError,
} from '../domain/auth.errors';
import { AuthService } from './auth.service';
import { MemberService } from './member.service';

class SeqIds implements ResourceIdGenerator {
  private n = 0;
  generate(): string {
    return `id-${++this.n}`;
  }
}
class MutableClock implements ResourceClock {
  private current = new Date('2026-06-01T00:00:00.000Z');
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

const SESSION_TTL = 60 * 60 * 1000;
const INVITE_TTL = 7 * 24 * 60 * 60 * 1000;
const OWNER = { organizationName: 'Acme', name: 'Ada', email: 'ada@acme.test', password: 'sup3rsecret' };

function make() {
  const organizations = new InMemoryOrganizationRepository();
  const users = new InMemoryUserRepository();
  const memberships = new InMemoryMembershipRepository();
  const sessions = new InMemorySessionRepository();
  const invitations = new InMemoryInvitationRepository();
  const hasher = new ScryptPasswordHasher();
  const tokens = new CryptoTokenGenerator();
  const ids = new SeqIds();
  const clock = new MutableClock();
  const auth = new AuthService(organizations, users, memberships, sessions, hasher, tokens, ids, clock, SESSION_TTL);
  const members = new MemberService(
    users,
    memberships,
    invitations,
    sessions,
    hasher,
    tokens,
    ids,
    clock,
    auth,
    INVITE_TTL,
    'http://localhost:3000',
  );
  return { organizations, users, memberships, sessions, invitations, clock, auth, members };
}

/** Register the owner and return the actor context + their session token. */
async function withOwner(ctx: ReturnType<typeof make>): Promise<{ actor: ActorContext; token: string }> {
  const { principal, sessionToken } = await ctx.auth.register(OWNER);
  return {
    actor: { organizationId: principal.organization.id, actorId: principal.user.id },
    token: sessionToken,
  };
}

describe('MemberService.invite', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a pending invitation with an accept token + url', async () => {
    const { actor } = await withOwner(ctx);
    const result = await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['warehouse_staff'] });
    expect(result.invitation.status).toBe('pending');
    expect(result.invitation.roleIds).toEqual(['warehouse_staff']);
    expect(result.token).toBeTruthy();
    expect(result.acceptUrl).toContain(`token=${result.token}`);
  });

  it('refuses to assign the Owner role', async () => {
    const { actor } = await withOwner(ctx);
    await expect(ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['owner'] })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects a duplicate pending invite and an email that already has an account', async () => {
    const { actor } = await withOwner(ctx);
    await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['viewer'] });
    await expect(ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['viewer'] })).rejects.toBeInstanceOf(
      InvitationExistsError,
    );
    await expect(ctx.members.invite(actor, { email: OWNER.email, roleIds: ['viewer'] })).rejects.toBeInstanceOf(
      EmailTakenError,
    );
  });
});

describe('MemberService.acceptInvitation', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates the user + membership, opens a session, and consumes the invite', async () => {
    const { actor } = await withOwner(ctx);
    const invite = await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['warehouse_staff'] });
    const { principal, sessionToken } = await ctx.members.acceptInvitation({
      token: invite.token,
      name: 'Bob',
      password: 'anothersecret',
    });
    expect(principal.user.email).toBe('bob@acme.test');
    expect(principal.membership.roleIds).toEqual(['warehouse_staff']);

    const resolved = await ctx.auth.authenticate(sessionToken);
    expect(resolved?.permissions).toContain(INVENTORY_PERMISSIONS.adjust);
    expect(resolved?.permissions).not.toContain(BILLING_PERMISSIONS.manage);

    // The invitation is now non-pending — a second accept fails.
    await expect(
      ctx.members.acceptInvitation({ token: invite.token, name: 'Bob', password: 'x2xxxxxx' }),
    ).rejects.toBeInstanceOf(InvalidInvitationError);
  });

  it('rejects an unknown or expired token', async () => {
    const { actor } = await withOwner(ctx);
    await expect(
      ctx.members.acceptInvitation({ token: 'nope', name: 'X', password: 'xxxxxxxx' }),
    ).rejects.toBeInstanceOf(InvalidInvitationError);

    const invite = await ctx.members.invite(actor, { email: 'late@acme.test', roleIds: ['viewer'] });
    ctx.clock.advance(INVITE_TTL + 1);
    await expect(
      ctx.members.acceptInvitation({ token: invite.token, name: 'Late', password: 'xxxxxxxx' }),
    ).rejects.toBeInstanceOf(InvalidInvitationError);
  });
});

describe('MemberService.listMembers / updateRoles / removeMember', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('lists active members and pending invitations', async () => {
    const { actor } = await withOwner(ctx);
    await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['viewer'] });
    const list = await ctx.members.listMembers(actor);
    expect(list).toHaveLength(2);
    expect(list.find((m) => m.status === 'active')?.email).toBe(OWNER.email);
    expect(list.find((m) => m.status === 'invited')?.email).toBe('bob@acme.test');
  });

  it('updates a member\'s roles and revokes their existing sessions', async () => {
    const { actor } = await withOwner(ctx);
    const invite = await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['warehouse_staff'] });
    const accepted = await ctx.members.acceptInvitation({ token: invite.token, name: 'Bob', password: 'xxxxxxxx' });

    const updated = await ctx.members.updateRoles(actor, accepted.principal.membership.id, { roleIds: ['viewer'] });
    expect(updated.roleIds).toEqual(['viewer']);
    // Bob's pre-existing session is revoked so the new permissions apply immediately.
    expect(await ctx.auth.authenticate(accepted.sessionToken)).toBeNull();
  });

  it('cannot assign Owner or demote/remove the last Owner', async () => {
    const { actor } = await withOwner(ctx);
    const ownerMembership = await ctx.memberships.findByUserAndOrg(actor.organizationId, actor.actorId!);
    expect(ownerMembership).not.toBeNull();

    await expect(
      ctx.members.updateRoles(actor, ownerMembership!.id, { roleIds: ['owner'] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      ctx.members.updateRoles(actor, ownerMembership!.id, { roleIds: ['admin'] }),
    ).rejects.toBeInstanceOf(LastOwnerError);
    await expect(ctx.members.removeMember(actor, ownerMembership!.id)).rejects.toBeInstanceOf(LastOwnerError);
  });

  it('removes a member and revokes their sessions; missing member → 404', async () => {
    const { actor } = await withOwner(ctx);
    const invite = await ctx.members.invite(actor, { email: 'bob@acme.test', roleIds: ['viewer'] });
    const accepted = await ctx.members.acceptInvitation({ token: invite.token, name: 'Bob', password: 'xxxxxxxx' });

    await ctx.members.removeMember(actor, accepted.principal.membership.id);
    expect(await ctx.memberships.findByUserAndOrg(actor.organizationId, accepted.principal.user.id)).toBeNull();
    expect(await ctx.auth.authenticate(accepted.sessionToken)).toBeNull();
    await expect(ctx.members.removeMember(actor, 'missing')).rejects.toBeInstanceOf(MemberNotFoundError);
  });
});
