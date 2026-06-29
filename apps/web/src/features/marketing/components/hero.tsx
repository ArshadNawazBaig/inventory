import Link from 'next/link';
import { Badge, Button } from '@stockflow/ui';
import { AuditIcon, ChevronRightIcon } from '@stockflow/icons';
import { HERO_STATS } from '../marketing-content';

/**
 * Hero section — the single `<h1>` for the page, primary/secondary CTAs, and a stat strip that
 * summarizes the platform's defining capabilities. Server-rendered, no client JS.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Subtle, token-driven background wash — purely decorative. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/60 to-background"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="primary" appearance="soft" leadingIcon={AuditIcon} className="mb-6">
            Stock accuracy is the product
          </Badge>

          <h1
            id="hero-heading"
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Enterprise inventory you can{' '}
            <span className="text-primary">actually trust</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            {/* APP.name is intentionally not interpolated here so the headline copy reads cleanly. */}
            StockFlow runs your warehouse on an immutable, fully audited stock ledger — every
            movement reconcilable, every team governed by granular roles, every number live across
            100k+ SKUs.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" trailingIcon={ChevronRightIcon}>
              <Link href="/register">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">Explore the product</Link>
            </Button>
          </div>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-card p-5 text-center">
              <dt className="order-2 text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
