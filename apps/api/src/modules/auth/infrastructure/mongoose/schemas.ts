import { Schema } from 'mongoose';
import type { SystemRoleId } from '@stockflow/types';
import type { InvitationStatus } from '../../domain/entities';

/**
 * Mongoose schemas for the auth collections. Conventions match the rest of the codebase: **`_id` is the
 * service-generated id** (sessions use the SHA-256 token hash as `_id`), all id/tenant fields are strings,
 * `versionKey` off, mappers are just `id ⇄ _id`.
 */

export const ORGANIZATION_MODEL = 'AuthOrganization';
export const USER_MODEL = 'AuthUser';
export const MEMBERSHIP_MODEL = 'AuthMembership';
export const SESSION_MODEL = 'AuthSession';
export const INVITATION_MODEL = 'AuthInvitation';

export interface OrganizationDoc {
  _id: string;
  name: string;
  createdAt: Date;
}

export interface UserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipDoc {
  _id: string;
  organizationId: string;
  userId: string;
  roleIds: SystemRoleId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDoc {
  _id: string; // SHA-256 of the opaque token
  userId: string;
  organizationId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface InvitationDoc {
  _id: string;
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

export const OrganizationSchema = new Schema<OrganizationDoc>(
  {
    _id: { type: String },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'organizations', versionKey: false },
);

export const UserSchema = new Schema<UserDoc>(
  {
    _id: { type: String },
    email: { type: String, required: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'users', versionKey: false },
);
UserSchema.index({ email: 1 }, { unique: true }); // global credential lookup; one account per email

export const MembershipSchema = new Schema<MembershipDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    userId: { type: String, required: true },
    roleIds: { type: [String], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'memberships', versionKey: false },
);
MembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true }); // one membership per (user, org)
MembershipSchema.index({ userId: 1 });
MembershipSchema.index({ organizationId: 1, roleIds: 1 }); // countByRole / role drill-downs

export const SessionSchema = new Schema<SessionDoc>(
  {
    _id: { type: String },
    userId: { type: String, required: true },
    organizationId: { type: String, required: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'sessions', versionKey: false },
);
SessionSchema.index({ userId: 1 }); // "log out everywhere" / revoke on role change
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo TTL prunes expired sessions

export const InvitationSchema = new Schema<InvitationDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    email: { type: String, required: true },
    roleIds: { type: [String], default: [] },
    tokenHash: { type: String, required: true },
    status: { type: String, required: true },
    invitedByUserId: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { collection: 'invitations', versionKey: false },
);
InvitationSchema.index({ tokenHash: 1 }, { unique: true });
InvitationSchema.index({ organizationId: 1, email: 1, status: 1 });
