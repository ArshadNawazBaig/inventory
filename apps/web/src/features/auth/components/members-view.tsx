'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@stockflow/ui';
import { MEMBER_PERMISSIONS, type MemberResponse } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useHasPermission, useMembers, useRemoveMember } from '../use-session';
import { InviteMemberDialog } from './invite-member-dialog';
import { MemberRolesDialog } from './member-roles-dialog';

const isOwner = (member: MemberResponse): boolean => member.roles.some((role) => role.id === 'owner');

/** People management — the org's members + pending invitations, with role assignment and removal. */
export function MembersView() {
  const { data, isLoading, isError, error, refetch } = useMembers();
  const canInvite = useHasPermission(MEMBER_PERMISSIONS.invite);
  const canUpdate = useHasPermission(MEMBER_PERMISSIONS.update);
  const canRemove = useHasPermission(MEMBER_PERMISSIONS.remove);
  const removeMutation = useRemoveMember();
  const [editing, setEditing] = useState<MemberResponse | null>(null);

  const onRemove = (member: MemberResponse): void => {
    if (!window.confirm(`Remove ${member.email} from the organization?`)) return;
    removeMutation.mutate(member.id, {
      onSuccess: () => toast.success('Member removed'),
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your organization and what they can do.
          </p>
        </div>
        {canInvite ? <InviteMemberDialog /> : null}
      </header>

      {isError ? (
        <ErrorState
          title="Couldn’t load members"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !data ? (
        <Skeleton variant="rounded" className="h-64 w-full" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">{member.name ?? '—'}</span>
                    <span className="block text-xs text-muted-foreground">{member.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <Badge key={role.id} tone="neutral" appearance="outline" size="sm">
                          {role.name}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={member.status === 'active' ? 'success' : 'warning'} appearance="soft" size="sm">
                      {member.status === 'active' ? 'Active' : 'Invited'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.status === 'active' && !isOwner(member) ? (
                      <span className="flex justify-end gap-2">
                        {canUpdate ? (
                          <Button variant="outline" size="sm" onClick={() => setEditing(member)}>
                            Manage roles
                          </Button>
                        ) : null}
                        {canRemove ? (
                          <Button variant="ghost" size="sm" onClick={() => onRemove(member)}>
                            Remove
                          </Button>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isOwner(member) ? 'Owner' : 'Pending'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <MemberRolesDialog
        member={editing}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
