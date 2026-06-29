'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@stockflow/ui';
import type { MemberResponse, SystemRoleId } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { useRoles, useUpdateMemberRoles } from '../use-session';
import { RolePicker } from './role-picker';

/** Edit a member's roles. Controlled by the parent (open + the member being edited). Owner is not assignable. */
export function MemberRolesDialog({
  member,
  open,
  onOpenChange,
}: {
  member: MemberResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: rolesData } = useRoles();
  const updateMutation = useUpdateMemberRoles();
  const [roleIds, setRoleIds] = useState<SystemRoleId[]>([]);
  const assignableRoles = (rolesData?.data ?? []).filter((role) => role.id !== 'owner');

  // Seed the picker from the member whenever the dialog opens for a (new) member.
  useEffect(() => {
    if (member) setRoleIds(member.roles.map((role) => role.id));
  }, [member]);

  const save = async (): Promise<void> => {
    if (!member) return;
    try {
      await updateMutation.mutateAsync({ id: member.id, body: { roleIds } });
      toast.success('Roles updated');
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription>{member?.email}</DialogDescription>
        </DialogHeader>
        <RolePicker roles={assignableRoles} value={roleIds} onChange={setRoleIds} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void save()}
            disabled={roleIds.length === 0 || updateMutation.isPending}
            loading={updateMutation.isPending}
          >
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
