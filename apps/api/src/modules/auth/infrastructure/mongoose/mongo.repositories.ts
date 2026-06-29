import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { SystemRoleId } from '@stockflow/types';
import type {
  InvitationEntity,
  MembershipEntity,
  OrganizationEntity,
  SessionEntity,
  UserEntity,
} from '../../domain/entities';
import type {
  InvitationRepository,
  MembershipRepository,
  OrganizationRepository,
  SessionRepository,
  UserRepository,
} from '../../application/ports';
import {
  INVITATION_MODEL,
  MEMBERSHIP_MODEL,
  ORGANIZATION_MODEL,
  SESSION_MODEL,
  USER_MODEL,
  type InvitationDoc,
  type MembershipDoc,
  type OrganizationDoc,
  type SessionDoc,
  type UserDoc,
} from './schemas';

/**
 * Mongoose adapters for the auth collections — each implements the same port as its in-memory twin, so the
 * application is untouched. The only mapping is `id ⇄ _id` (sessions key on the token hash); arrays are copied.
 */

// ─── Organizations ────────────────────────────────────────────────────────────────
function toOrganization(doc: OrganizationDoc): OrganizationEntity {
  return { id: doc._id, name: doc.name, createdAt: doc.createdAt };
}

@Injectable()
export class MongoOrganizationRepository implements OrganizationRepository {
  constructor(@InjectModel(ORGANIZATION_MODEL) private readonly model: Model<OrganizationDoc>) {}

  async insert(organization: OrganizationEntity): Promise<OrganizationEntity> {
    const { id, ...rest } = organization;
    await this.model.create({ _id: id, ...rest });
    return { ...organization };
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const doc = await this.model.findById(id).lean<OrganizationDoc>().exec();
    return doc ? toOrganization(doc) : null;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────────
function toUser(doc: UserDoc): UserEntity {
  return {
    id: doc._id,
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    emailVerifiedAt: doc.emailVerifiedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(@InjectModel(USER_MODEL) private readonly model: Model<UserDoc>) {}

  async insert(user: UserEntity): Promise<UserEntity> {
    const { id, ...rest } = user;
    await this.model.create({ _id: id, ...rest });
    return { ...user };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.model.findById(id).lean<UserDoc>().exec();
    return doc ? toUser(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.model.findOne({ email }).lean<UserDoc>().exec();
    return doc ? toUser(doc) : null;
  }
}

// ─── Memberships ──────────────────────────────────────────────────────────────────
function toMembership(doc: MembershipDoc): MembershipEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    userId: doc.userId,
    roleIds: [...doc.roleIds],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

@Injectable()
export class MongoMembershipRepository implements MembershipRepository {
  constructor(@InjectModel(MEMBERSHIP_MODEL) private readonly model: Model<MembershipDoc>) {}

  async insert(membership: MembershipEntity): Promise<MembershipEntity> {
    const { id, ...rest } = membership;
    await this.model.create({ _id: id, ...rest });
    return { ...membership, roleIds: [...membership.roleIds] };
  }

  async findById(organizationId: string, id: string): Promise<MembershipEntity | null> {
    const doc = await this.model.findOne({ _id: id, organizationId }).lean<MembershipDoc>().exec();
    return doc ? toMembership(doc) : null;
  }

  async findByUserAndOrg(organizationId: string, userId: string): Promise<MembershipEntity | null> {
    const doc = await this.model.findOne({ organizationId, userId }).lean<MembershipDoc>().exec();
    return doc ? toMembership(doc) : null;
  }

  async listByUser(userId: string): Promise<MembershipEntity[]> {
    const docs = await this.model.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean<MembershipDoc[]>().exec();
    return docs.map(toMembership);
  }

  async listByOrg(organizationId: string): Promise<MembershipEntity[]> {
    const docs = await this.model
      .find({ organizationId })
      .sort({ createdAt: 1, _id: 1 })
      .lean<MembershipDoc[]>()
      .exec();
    return docs.map(toMembership);
  }

  countByRole(organizationId: string, roleId: SystemRoleId): Promise<number> {
    return this.model.countDocuments({ organizationId, roleIds: roleId }).exec();
  }

  async update(
    organizationId: string,
    id: string,
    patch: Partial<MembershipEntity>,
  ): Promise<MembershipEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id, organizationId }, { $set: set }, { returnDocument: 'after' })
      .lean<MembershipDoc>()
      .exec();
    return doc ? toMembership(doc) : null;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id, organizationId }).exec();
    return result.deletedCount > 0;
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────────
function toSession(doc: SessionDoc): SessionEntity {
  return {
    id: doc._id,
    userId: doc.userId,
    organizationId: doc.organizationId,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
  };
}

@Injectable()
export class MongoSessionRepository implements SessionRepository {
  constructor(@InjectModel(SESSION_MODEL) private readonly model: Model<SessionDoc>) {}

  async insert(session: SessionEntity): Promise<SessionEntity> {
    const { id, ...rest } = session;
    await this.model.create({ _id: id, ...rest });
    return { ...session };
  }

  async findById(id: string): Promise<SessionEntity | null> {
    const doc = await this.model.findById(id).lean<SessionDoc>().exec();
    return doc ? toSession(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async deleteByUser(userId: string): Promise<number> {
    const result = await this.model.deleteMany({ userId }).exec();
    return result.deletedCount;
  }
}

// ─── Invitations ──────────────────────────────────────────────────────────────────
function toInvitation(doc: InvitationDoc): InvitationEntity {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    email: doc.email,
    roleIds: [...doc.roleIds],
    tokenHash: doc.tokenHash,
    status: doc.status,
    invitedByUserId: doc.invitedByUserId,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    acceptedAt: doc.acceptedAt,
  };
}

@Injectable()
export class MongoInvitationRepository implements InvitationRepository {
  constructor(@InjectModel(INVITATION_MODEL) private readonly model: Model<InvitationDoc>) {}

  async insert(invitation: InvitationEntity): Promise<InvitationEntity> {
    const { id, ...rest } = invitation;
    await this.model.create({ _id: id, ...rest });
    return { ...invitation, roleIds: [...invitation.roleIds] };
  }

  async findByTokenHash(tokenHash: string): Promise<InvitationEntity | null> {
    const doc = await this.model.findOne({ tokenHash }).lean<InvitationDoc>().exec();
    return doc ? toInvitation(doc) : null;
  }

  async findPendingByOrgAndEmail(
    organizationId: string,
    email: string,
  ): Promise<InvitationEntity | null> {
    const doc = await this.model
      .findOne({ organizationId, email, status: 'pending' })
      .lean<InvitationDoc>()
      .exec();
    return doc ? toInvitation(doc) : null;
  }

  async listPendingByOrg(organizationId: string): Promise<InvitationEntity[]> {
    const docs = await this.model
      .find({ organizationId, status: 'pending' })
      .sort({ createdAt: 1, _id: 1 })
      .lean<InvitationDoc[]>()
      .exec();
    return docs.map(toInvitation);
  }

  async update(id: string, patch: Partial<InvitationEntity>): Promise<InvitationEntity | null> {
    const { id: _ignore, ...set } = patch;
    const doc = await this.model
      .findOneAndUpdate({ _id: id }, { $set: set }, { returnDocument: 'after' })
      .lean<InvitationDoc>()
      .exec();
    return doc ? toInvitation(doc) : null;
  }
}
