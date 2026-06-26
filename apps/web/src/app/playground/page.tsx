import { ShowcasePage } from './_ui/showcase';
import { PLAYGROUND_GROUPS, READY_COUNT, TOTAL_COUNT } from './components';

export default function PlaygroundIndexPage() {
  return (
    <ShowcasePage
      title="Component playground"
      description="Pick a component from the sidebar. Toggle light/dark at the bottom of the sidebar — every component is token-driven, so they all re-theme together."
    >
      <p className="text-sm text-muted-foreground">
        {READY_COUNT} of {TOTAL_COUNT} components implemented. The rest are listed in the sidebar as
        “soon”, in build order.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAYGROUND_GROUPS.map((group) => {
          const ready = group.items.filter((i) => i.ready).length;
          return (
            <div
              key={group.title}
              className="rounded-xl border border-border bg-card p-4 text-card-foreground"
            >
              <p className="text-sm font-medium">{group.title}</p>
              <p className="text-xs text-muted-foreground">
                {ready} / {group.items.length} ready
              </p>
            </div>
          );
        })}
      </div>
    </ShowcasePage>
  );
}
