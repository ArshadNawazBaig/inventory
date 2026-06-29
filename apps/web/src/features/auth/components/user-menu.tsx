'use client';

import { useRouter } from 'next/navigation';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@stockflow/ui';
import { useLogout, useSession } from '../use-session';

/** Account dropdown in the app navbar — shows the user, org and roles, and signs out. */
export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const logoutMutation = useLogout();

  if (!session) return null;

  const onSignOut = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
    router.replace('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar size="sm" name={session.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium text-foreground">{session.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="truncate text-xs font-medium text-foreground">{session.organizationName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {session.roles.map((role) => role.name).join(', ')}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void onSignOut();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
