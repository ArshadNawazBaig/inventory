import { APP } from '@stockflow/config';
import { Button, cn } from '@stockflow/ui';

export default function HomePage() {
  return (
    <main
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-foreground',
      )}
    >
      <h1 className="text-3xl font-semibold tracking-tight text-primary">{APP.name}</h1>
      <p className="text-sm text-muted-foreground">Foundation ready — design tokens wired.</p>
      <Button asChild>
        <a href="/playground">View components →</a>
      </Button>
    </main>
  );
}
