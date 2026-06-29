'use client';

import { useId, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  toast,
} from '@stockflow/ui';
import type { SystemRoleId } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { useInviteMember, useRoles } from '../use-session';
import { RolePicker } from './role-picker';

/**
 * Invite a person to the organization with one or more roles. Because email delivery (Resend) is a follow-up,
 * the generated accept link is shown here for the admin to share directly.
 */
export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<SystemRoleId[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const emailId = useId();
  const { data: rolesData } = useRoles();
  const inviteMutation = useInviteMember();
  const assignableRoles = (rolesData?.data ?? []).filter((role) => role.id !== 'owner');

  const reset = (): void => {
    setEmail('');
    setRoleIds([]);
    setInviteLink(null);
  };

  const submit = async (): Promise<void> => {
    try {
      const invitation = await inviteMutation.mutateAsync({ email, roleIds });
      setInviteLink(invitation.acceptUrl);
      toast.success('Invitation created');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const copyLink = async (): Promise<void> => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied');
  };

  const canSubmit = email.trim().length > 0 && roleIds.length > 0 && !inviteMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Invite member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>Send an invitation with one or more roles.</DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Share this single-use link so they can set a password and join:
            </p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} aria-label="Invitation link" />
              <Button variant="outline" onClick={() => void copyLink()}>
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Email" htmlFor={emailId}>
              <Input
                id={emailId}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="person@company.com"
              />
            </Field>
            <Field label="Roles">
              <RolePicker roles={assignableRoles} value={roleIds} onChange={setRoleIds} />
            </Field>
          </div>
        )}

        <DialogFooter>
          {inviteLink ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <Button onClick={() => void submit()} disabled={!canSubmit} loading={inviteMutation.isPending}>
              Create invitation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
