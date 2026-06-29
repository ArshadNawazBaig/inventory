import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose, { type Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  MongoInvitationRepository,
  MongoMembershipRepository,
  MongoOrganizationRepository,
  MongoSessionRepository,
  MongoUserRepository,
} from './mongo.repositories';
import {
  INVITATION_MODEL,
  InvitationSchema,
  MEMBERSHIP_MODEL,
  MembershipSchema,
  ORGANIZATION_MODEL,
  OrganizationSchema,
  SESSION_MODEL,
  SessionSchema,
  USER_MODEL,
  UserSchema,
  type InvitationDoc,
  type MembershipDoc,
  type OrganizationDoc,
  type SessionDoc,
  type UserDoc,
} from './schemas';

/**
 * Parity test for the Mongoose auth adapters against a real (ephemeral) MongoDB — proves they satisfy the
 * ports with the same semantics as the in-memory ones (roundtrip, unique email, countByRole, session revoke,
 * invitation lookup/consume, tenant scoping).
 */

const ORG = 'org-1';
const AT = new Date('2026-06-01T00:00:00.000Z');
let mem: MongoMemoryServer;
let organizations: MongoOrganizationRepository;
let users: MongoUserRepository;
let memberships: MongoMembershipRepository;
let sessions: MongoSessionRepository;
let invitations: MongoInvitationRepository;
let userModel: Model<UserDoc>;
let invitationModel: Model<InvitationDoc>;

let counter = 0;
const oid = (): string => String(++counter).padStart(24, '0');

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  const orgModel = mongoose.model<OrganizationDoc>(ORGANIZATION_MODEL, OrganizationSchema);
  userModel = mongoose.model<UserDoc>(USER_MODEL, UserSchema);
  const membershipModel = mongoose.model<MembershipDoc>(MEMBERSHIP_MODEL, MembershipSchema);
  const sessionModel = mongoose.model<SessionDoc>(SESSION_MODEL, SessionSchema);
  invitationModel = mongoose.model<InvitationDoc>(INVITATION_MODEL, InvitationSchema);
  await Promise.all([userModel.init(), invitationModel.init(), membershipModel.init()]); // build unique indexes
  organizations = new MongoOrganizationRepository(orgModel);
  users = new MongoUserRepository(userModel);
  memberships = new MongoMembershipRepository(membershipModel);
  sessions = new MongoSessionRepository(sessionModel);
  invitations = new MongoInvitationRepository(invitationModel);
}, 60_000);

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('Mongo auth repositories', () => {
  it('organizations + users roundtrip; email is unique + the credential lookup', async () => {
    const org = await organizations.insert({ id: oid(), name: 'Acme', createdAt: AT });
    expect(await organizations.findById(org.id)).toEqual(org);

    const user = {
      id: oid(),
      email: 'ada@acme.test',
      name: 'Ada',
      passwordHash: 'scrypt$abc$def',
      emailVerifiedAt: null,
      createdAt: AT,
      updatedAt: AT,
    };
    await users.insert(user);
    expect(await users.findByEmail('ada@acme.test')).toEqual(user);
    expect(await users.findById(user.id)).toEqual(user);
    await expect(
      userModel.create({
        _id: oid(),
        email: 'ada@acme.test',
        name: 'Dup',
        passwordHash: 'scrypt$x$y',
        emailVerifiedAt: null,
        createdAt: AT,
        updatedAt: AT,
      }),
    ).rejects.toThrow(); // unique email index
  });

  it('memberships: countByRole, listByOrg, update, delete, tenant scope', async () => {
    const owner = await memberships.insert({
      id: oid(),
      organizationId: ORG,
      userId: oid(),
      roleIds: ['owner'],
      createdAt: AT,
      updatedAt: AT,
    });
    await memberships.insert({
      id: oid(),
      organizationId: ORG,
      userId: oid(),
      roleIds: ['viewer'],
      createdAt: AT,
      updatedAt: AT,
    });
    await memberships.insert({
      id: oid(),
      organizationId: 'org-2',
      userId: oid(),
      roleIds: ['owner'],
      createdAt: AT,
      updatedAt: AT,
    });

    expect(await memberships.countByRole(ORG, 'owner')).toBe(1);
    expect(await memberships.findByUserAndOrg(ORG, owner.userId)).toEqual(owner);
    expect(await memberships.listByOrg(ORG)).toHaveLength(2);
    expect(await memberships.findById('org-2', owner.id)).toBeNull(); // tenant scope

    const updated = await memberships.update(ORG, owner.id, { roleIds: ['admin'], updatedAt: AT });
    expect(updated?.roleIds).toEqual(['admin']);
    expect(await memberships.countByRole(ORG, 'owner')).toBe(0);
    expect(await memberships.delete(ORG, owner.id)).toBe(true);
    expect(await memberships.findById(ORG, owner.id)).toBeNull();
  });

  it('sessions: roundtrip, delete, and revoke-all for a user', async () => {
    const userId = oid();
    const s1 = { id: oid(), userId, organizationId: ORG, createdAt: AT, expiresAt: new Date('2026-07-01T00:00:00.000Z') };
    const s2 = { id: oid(), userId, organizationId: ORG, createdAt: AT, expiresAt: new Date('2026-07-01T00:00:00.000Z') };
    await sessions.insert(s1);
    await sessions.insert(s2);
    expect(await sessions.findById(s1.id)).toEqual(s1);
    expect(await sessions.deleteByUser(userId)).toBe(2);
    expect(await sessions.findById(s1.id)).toBeNull();
  });

  it('invitations: token lookup, pending-by-email, consume', async () => {
    const inv = await invitations.insert({
      id: oid(),
      organizationId: ORG,
      email: 'bob@acme.test',
      roleIds: ['viewer'],
      tokenHash: 'hash-1',
      status: 'pending',
      invitedByUserId: oid(),
      expiresAt: new Date('2026-07-01T00:00:00.000Z'),
      createdAt: AT,
      acceptedAt: null,
    });
    expect(await invitations.findByTokenHash('hash-1')).toEqual(inv);
    expect((await invitations.findPendingByOrgAndEmail(ORG, 'bob@acme.test'))?.id).toBe(inv.id);
    expect(await invitations.listPendingByOrg(ORG)).toHaveLength(1);

    await invitations.update(inv.id, { status: 'accepted', acceptedAt: AT });
    expect(await invitations.findPendingByOrgAndEmail(ORG, 'bob@acme.test')).toBeNull();
    expect(await invitations.listPendingByOrg(ORG)).toHaveLength(0);
  });
});
