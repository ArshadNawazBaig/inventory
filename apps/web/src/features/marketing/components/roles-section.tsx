import { Badge } from '@stockflow/ui';
import { ROLE_SECTION_ICON, ROLES } from '../marketing-content';

/**
 * "Built for every team" — surfaces the seven system roles the platform ships with, each as a
 * named tile with a short responsibility summary. Reinforces the deny-by-default RBAC story.
 */
export function RolesSection() {
  const Icon = ROLE_SECTION_ICON;

  return (
    <section
      id="roles"
      aria-labelledby="roles-heading"
      className="scroll-mt-16 border-y border-border bg-muted/40"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="neutral" appearance="outline" leadingIcon={Icon} className="mb-4">
            Role-based access control
          </Badge>
          <h2
            id="roles-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Built for every team
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Seven roles out of the box, each scoped to the active organization and deny-by-default.
            Bundle granular permissions into custom roles when you need more.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <li
              key={role.name}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="font-medium text-foreground">{role.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{role.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
