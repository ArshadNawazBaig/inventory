'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUserResponse, UpdateMemberRolesRequest } from '@stockflow/types';
import { ApiError } from '@/lib/api';
import {
  acceptInvite,
  getMe,
  inviteMember,
  listMembers,
  listRoles,
  login,
  logout,
  register,
  removeMember,
  updateMemberRoles,
} from './api';

const SESSION_KEY = ['auth', 'me'] as const;
const MEMBERS_KEY = ['members'] as const;
const ROLES_KEY = ['roles'] as const;

/**
 * The current session. Resolves to the authenticated principal, or `null` when unauthenticated (a 401 is a
 * valid "logged-out" answer, not an error). The cache is the single source of truth the shell + guards read.
 */
export function useSession() {
  return useQuery<AuthUserResponse | null>({
    queryKey: SESSION_KEY,
    queryFn: async ({ signal }) => {
      try {
        return await getMe(signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

/** Whether the current session holds a permission (UI mirroring only — the server still enforces). */
export function useHasPermission(permission: string): boolean {
  const { data } = useSession();
  return data?.permissions.includes(permission) ?? false;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData(SESSION_KEY, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => queryClient.setQueryData(SESSION_KEY, user),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: (user) => queryClient.setQueryData(SESSION_KEY, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drop all cached tenant data, then reset the session to logged-out.
      queryClient.clear();
      queryClient.setQueryData(SESSION_KEY, null);
    },
  });
}

// ─── Member management ──────────────────────────────────────────────────────────
export function useMembers() {
  return useQuery({ queryKey: MEMBERS_KEY, queryFn: ({ signal }) => listMembers(signal) });
}

export function useRoles() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: ({ signal }) => listRoles(signal), staleTime: Infinity });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}

export function useUpdateMemberRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMemberRolesRequest }) => updateMemberRoles(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}
