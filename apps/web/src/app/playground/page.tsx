'use client';

import { AddIcon, DeleteIcon, SearchIcon } from '@stockflow/icons';
import { Button, Input } from '@stockflow/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function PlaygroundPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Button</h1>
        <p className="text-sm text-muted-foreground">@stockflow/ui — component playground</p>
      </header>

      <Section title="Variants">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section title="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Add" leadingIcon={AddIcon} />
      </Section>

      <Section title="With icons">
        <Button leadingIcon={AddIcon}>Add product</Button>
        <Button variant="destructive" trailingIcon={DeleteIcon}>
          Delete
        </Button>
      </Section>

      <Section title="States">
        <Button loading loadingText="Saving…">
          Save
        </Button>
        <Button loading variant="secondary">
          Loading
        </Button>
        <Button disabled>Disabled</Button>
        <Button fullWidth>Full width</Button>
      </Section>

      <Section title="As link (asChild)">
        <Button asChild>
          <a href="/">Home</a>
        </Button>
        <Button asChild variant="link">
          <a href="/">Back home</a>
        </Button>
      </Section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Input
        </h2>
        <div className="grid max-w-md gap-3">
          <Input aria-label="Default" placeholder="Default" />
          <Input aria-label="Search" leadingIcon={SearchIcon} placeholder="Search products…" />
          <Input aria-label="Price" prefix="$" suffix="USD" placeholder="0.00" />
          <Input aria-label="Clearable" clearable defaultValue="Clear me" />
          <Input aria-label="Password" type="password" defaultValue="secret" />
          <Input aria-label="Invalid" invalid defaultValue="bad value" />
          <Input aria-label="Disabled" disabled defaultValue="Disabled" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dark theme
        </h2>
        <div className="dark flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button leadingIcon={AddIcon}>Add</Button>
          </div>
          <Input
            aria-label="Dark search"
            leadingIcon={SearchIcon}
            placeholder="Search… (default, sits on card)"
            className="max-w-sm"
          />
          <Input
            aria-label="Dark filled"
            variant="filled"
            placeholder="Filled variant (stands out anywhere)"
            className="max-w-sm"
          />
        </div>
      </section>
    </main>
  );
}
