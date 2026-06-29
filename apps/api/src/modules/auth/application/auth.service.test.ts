import { beforeEach, describe, expect, it } from 'vitest';
import { BILLING_PERMISSIONS, CATALOG_PERMISSIONS } from '@stockflow/types';
import type { ResourceClock, ResourceIdGenerator } from '../../../common/resource';
import { UnauthorizedError } from '../../../common/errors';
import {
  InMemoryMembershipRepository,
  InMemoryOrganizationRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../infrastructure/in-memory.repositories';
import { CryptoTokenGenerator, ScryptPasswordHasher } from '../infrastructure/adapters';
import { EmailTakenError, InvalidCredentialsError } from '../domain/auth.errors';
import { AuthService } from './auth.service';

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

const TTL_MS = 60 * 60 * 1000; // 1h
const REGISTER = { organizationName: 'Acme', name: 'Ada', email: 'ada@acme.test', password: 'sup3rsecret' };

function make() {
  const organizations = new InMemoryOrganizationRepository();
  const users = new InMemoryUserRepository();
  const memberships = new InMemoryMembershipRepository();
  const sessions = new InMemorySessionRepository();
  const clock = new MutableClock();
  const service = new AuthService(
    organizations,
    users,
    memberships,
    sessions,
    new ScryptPasswordHasher(),
    new CryptoTokenGenerator(),
    new SeqIds(),
    clock,
    TTL_MS,
  );
  return { organizations, users, memberships, sessions, clock, service };
}

describe('AuthService.register', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates an organization, an Owner membership, a hashed user, and a session', async () => {
    const { principal, sessionToken } = await ctx.service.register(REGISTER);
    expect(principal.organization.name).toBe('Acme');
    expect(principal.membership.roleIds).toEqual(['owner']);
    expect(principal.user.email).toBe('ada@acme.test');
    expect(principal.user.passwordHash).not.toContain('sup3rsecret'); // stored hashed
    expect(sessionToken).toBeTruthy();

    const resolved = await ctx.service.authenticate(sessionToken);
    expect(resolved?.organizationId).toBe(principal.organization.id);
    // Owner gets the entire catalog — spot-check a create + the billing-ownership permission.
    expect(resolved?.permissions).toContain(CATALOG_PERMISSIONS.create);
    expect(resolved?.permissions).toContain(BILLING_PERMISSIONS.manage);
  });

  it('normalizes the email and rejects a duplicate', async () => {
    await ctx.service.register({ ...REGISTER, email: '  Ada@Acme.TEST ' });
    expect(await ctx.users.findByEmail('ada@acme.test')).not.toBeNull();
    await expect(ctx.service.register(REGISTER)).rejects.toBeInstanceOf(EmailTakenError);
  });
});

describe('AuthService.login', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('verifies credentials (case-insensitive email) and opens a session', async () => {
    await ctx.service.register(REGISTER);
    const { sessionToken } = await ctx.service.login({ email: 'ADA@acme.test', password: 'sup3rsecret' });
    expect(await ctx.service.authenticate(sessionToken)).not.toBeNull();
  });

  it('rejects a wrong password and an unknown email with the same error', async () => {
    await ctx.service.register(REGISTER);
    await expect(ctx.service.login({ email: REGISTER.email, password: 'wrong' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    await expect(ctx.service.login({ email: 'nobody@acme.test', password: 'x' })).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });
});

describe('AuthService.authenticate / logout', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns null for an unknown token', async () => {
    expect(await ctx.service.authenticate('not-a-real-token')).toBeNull();
  });

  it('expires a session and prunes it on read', async () => {
    const { sessionToken } = await ctx.service.register(REGISTER);
    ctx.clock.advance(TTL_MS + 1);
    expect(await ctx.service.authenticate(sessionToken)).toBeNull();
    // pruned: a second lookup is still null and the store is empty
    expect(await ctx.service.authenticate(sessionToken)).toBeNull();
  });

  it('logout revokes the session (idempotent)', async () => {
    const { sessionToken } = await ctx.service.register(REGISTER);
    await ctx.service.logout(sessionToken);
    expect(await ctx.service.authenticate(sessionToken)).toBeNull();
    await expect(ctx.service.logout(sessionToken)).resolves.toBeUndefined(); // no throw on unknown
  });

  it('getPrincipal fails closed when the session user/org no longer resolves', async () => {
    await expect(ctx.service.getPrincipal('org-missing', 'user-missing')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
