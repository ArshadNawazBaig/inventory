import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Skeleton } from '@stockflow/ui';
import { AddIcon } from '@stockflow/icons';
import { ProductsBrowser } from '@/features/products/components/products-browser';

export const metadata: Metadata = { title: 'Products · StockFlow' };

/** Catalog list. The interactive browser (URL-synced filters + query) is isolated behind Suspense
 * because it reads `useSearchParams`. */
export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Your catalog of products and the variants you stock.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <AddIcon className="size-4" aria-hidden="true" />
            New product
          </Link>
        </Button>
      </header>

      <Suspense fallback={<ProductsListFallback />}>
        <ProductsBrowser />
      </Suspense>
    </div>
  );
}

function ProductsListFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
