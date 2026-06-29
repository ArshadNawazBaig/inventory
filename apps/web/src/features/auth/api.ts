import {
  AuthMessageResponseSchema,
  AuthUserResponseSchema,
  InvitationResponseSchema,
  MemberListResponseSchema,
  MemberResponseSchema,
  RoleListResponseSchema,
  type AcceptInvitationRequest,
  type AuthUserResponse,
  type InvitationResponse,
  type InviteMemberRequest,
  type LoginRequest,
  type MemberListResponse,
  type MemberResponse,
  type RegisterRequest,
  type RoleListResponse,
  type UpdateMemberRolesRequest,
} from '@stockflow/types';
import { apiRequest } from '@/lib/api';

/** Auth + member REST bindings. Each call validates the response against the shared Zod contract. */

export function getMe(signal?: AbortSignal): Promise<AuthUserResponse> {
  return apiRequest('/v1/auth/me', { schema: AuthUserResponseSchema, ...(signal ? { signal } : {}) });
}

export function register(body: RegisterRequest): Promise<AuthUserResponse> {
  return apiRequest('/v1/auth/register', { method: 'POST', body, schema: AuthUserResponseSchema });
}

export function login(body: LoginRequest): Promise<AuthUserResponse> {
  return apiRequest('/v1/auth/login', { method: 'POST', body, schema: AuthUserResponseSchema });
}

export function acceptInvite(body: AcceptInvitationRequest): Promise<AuthUserResponse> {
  return apiRequest('/v1/auth/accept-invite', { method: 'POST', body, schema: AuthUserResponseSchema });
}

export function logout(): Promise<void> {
  return apiRequest('/v1/auth/logout', { method: 'POST', schema: AuthMessageResponseSchema }).then(() => undefined);
}

export function listMembers(signal?: AbortSignal): Promise<MemberListResponse> {
  return apiRequest('/v1/members', { schema: MemberListResponseSchema, ...(signal ? { signal } : {}) });
}

export function inviteMember(body: InviteMemberRequest): Promise<InvitationResponse> {
  return apiRequest('/v1/members/invite', { method: 'POST', body, schema: InvitationResponseSchema });
}

export function updateMemberRoles(id: string, body: UpdateMemberRolesRequest): Promise<MemberResponse> {
  return apiRequest(`/v1/members/${id}/roles`, { method: 'PATCH', body, schema: MemberResponseSchema });
}

export function removeMember(id: string): Promise<void> {
  return apiRequest(`/v1/members/${id}`, { method: 'DELETE', schema: AuthMessageResponseSchema }).then(
    () => undefined,
  );
}

export function listRoles(signal?: AbortSignal): Promise<RoleListResponse> {
  return apiRequest('/v1/roles', { schema: RoleListResponseSchema, ...(signal ? { signal } : {}) });
}
