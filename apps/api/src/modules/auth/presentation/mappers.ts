import {
  SYSTEM_ROLES,
  permissionsForRoles,
  type AuthUserResponse,
  type InvitationResponse,
  type MemberResponse,
  type RoleResponse,
  type RoleSummary,
  type SystemRole,
  type SystemRoleId,
} from '@stockflow/types';
import type { AuthPrincipal } from '../domain/entities';
import type { InviteResult, MemberView } from '../application/member.service';

/** Map role ids to `{ id, name }` summaries (unknown ids fall back to the id, never throw). */
export function toRoleSummaries(roleIds: readonly SystemRoleId[]): RoleSummary[] {
  return roleIds.map((id) => ({ id, name: SYSTEM_ROLES.find((r) => r.id === id)?.name ?? id }));
}

/** The authenticated principal → the wire shape, with flattened effective permissions for the UI to mirror. */
export function toAuthUserResponse(principal: AuthPrincipal): AuthUserResponse {
  const { user, organization, membership } = principal;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: organization.id,
    organizationName: organization.name,
    roles: toRoleSummaries(membership.roleIds),
    permissions: permissionsForRoles(membership.roleIds),
  };
}

export function toMemberResponse(view: MemberView): MemberResponse {
  return {
    id: view.id,
    userId: view.userId,
    email: view.email,
    name: view.name,
    roles: toRoleSummaries(view.roleIds),
    status: view.status,
    createdAt: view.createdAt.toISOString(),
  };
}

export function toInvitationResponse(result: InviteResult): InvitationResponse {
  const { invitation, token, acceptUrl } = result;
  return {
    id: invitation.id,
    email: invitation.email,
    roles: toRoleSummaries(invitation.roleIds),
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    acceptToken: token,
    acceptUrl,
  };
}

export function toRoleResponse(role: SystemRole): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: [...role.permissions],
  };
}
