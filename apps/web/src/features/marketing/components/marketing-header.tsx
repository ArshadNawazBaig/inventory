import Link from 'next/link';
import { APP } from '@stockflow/config';
import { Button } from '@stockflow/ui';
import { ProductsIcon } from '@stockflow/icons';

/**
 * Sticky top bar for the landing page: brand wordmark on the left, auth actions on the right.
 * Server-rendered — navigation uses Next `<Link>` wrapped by the Button primitive via `asChild`.
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-hidden
          >
            <ProductsIcon className="size-5" />
          </span>
          <span className="text-lg">{APP.name}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="#features">Features</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Start free</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
