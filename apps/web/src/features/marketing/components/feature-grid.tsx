import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stockflow/ui';
import { FEATURES } from '../marketing-content';

/**
 * Feature grid — six capability tiles built on the Card primitive. Each tile pairs a shared
 * domain icon with concrete, accurate copy. Server-rendered.
 */
export function FeatureGrid() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-heading"
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          One system of record for every movement
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          From the catalog to the ledger to the dashboard, StockFlow keeps stock correct,
          governed, and observable as you grow.
        </p>
      </div>

      <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title}>
              <Card className="h-full">
                <CardHeader>
                  <span
                    className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Icon className="size-6" />
                  </span>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
