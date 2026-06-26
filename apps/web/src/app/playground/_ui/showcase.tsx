import type { ReactNode } from 'react';

/** Standard page frame for a component showcase: title, optional blurb, and stacked sections. */
export function ShowcasePage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}

/** A labelled row of inline examples (e.g. button variants). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

/** A labelled section that stacks arbitrary content (code blocks, tables, prose). */
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A card surface for form controls. In dark mode this is lighter than the page background, so
 * default-variant inputs/textareas read as a distinct "well" instead of blending in.
 */
export function Surface({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid max-w-md gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground">
        {children}
      </div>
    </section>
  );
}

/** Bulleted do/don't guidance under a component. */
export function Guidelines({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/** A props reference table sourced from the component's spec. */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-muted-foreground">
            <th className="px-3 py-2 font-medium">Prop</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Default</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2 align-top font-mono text-foreground">{row.name}</td>
              <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                {row.type}
              </td>
              <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                {row.default ?? '—'}
              </td>
              <td className="px-3 py-2 align-top text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
