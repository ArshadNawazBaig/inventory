'use client';

import { Checkbox } from '@stockflow/ui';
import type { RoleResponse, SystemRoleId } from '@stockflow/types';

/** Multi-select for assignable roles — a labelled checkbox per role with its description. */
export function RolePicker({
  roles,
  value,
  onChange,
}: {
  roles: RoleResponse[];
  value: SystemRoleId[];
  onChange: (next: SystemRoleId[]) => void;
}) {
  const toggle = (id: SystemRoleId, checked: boolean): void => {
    onChange(checked ? [...value, id] : value.filter((roleId) => roleId !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {roles.map((role) => (
        <label
          key={role.id}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/50"
        >
          <Checkbox
            checked={value.includes(role.id)}
            onCheckedChange={(checked) => toggle(role.id, checked === true)}
            aria-label={role.name}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">{role.name}</span>
            <span className="block text-xs text-muted-foreground">{role.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
