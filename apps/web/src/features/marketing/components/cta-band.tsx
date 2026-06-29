import Link from 'next/link';
import { Button } from '@stockflow/ui';
import { ChevronRightIcon } from '@stockflow/icons';

/**
 * Final call-to-action band — a single, unambiguous primary action driving to signup.
 */
export function CtaBand() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="rounded-2xl border border-border bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
        <h2
          id="cta-heading"
          className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          Ready to get your stock under control?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-primary-foreground/85">
          Spin up an organization, invite your team, and start tracking every movement on an
          audited ledger in minutes.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" variant="secondary" trailingIcon={ChevronRightIcon}>
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
