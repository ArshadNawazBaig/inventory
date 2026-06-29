import type { Metadata } from 'next';
import { APP } from '@stockflow/config';
import {
  CtaBand,
  FeatureGrid,
  Hero,
  MarketingFooter,
  MarketingHeader,
  RolesSection,
} from '@/features/marketing';

export const metadata: Metadata = {
  title: `${APP.name} — Enterprise inventory you can trust`,
  description:
    'StockFlow is a multi-tenant inventory management platform built on an immutable, fully ' +
    'audited stock ledger: granular RBAC, purchasing, sales, transfers, returns, real-time ' +
    'analytics, and a catalog designed for 100k+ SKUs.',
};

/**
 * Marketing landing page served at `/`. Fully server-rendered: the header, hero, feature grid,
 * roles, final CTA, and footer are composed from the `marketing` feature, which builds on the
 * `@stockflow/ui` primitives and `@stockflow/icons`. All colors come from design tokens, so the
 * page is correct in both light and dark mode.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <RolesSection />
        <CtaBand />
      </main>
      <MarketingFooter />
    </div>
  );
}
