import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@stockflow/ui';
import { ChevronLeftIcon } from '@stockflow/icons';
import { CreateProductForm } from '@/features/products/components/product-form';

export const metadata: Metadata = { title: 'New product · StockFlow' };

/** Create a product and its initial variant(s). The API persists both atomically. */
export default function NewProductPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <Button variant="link" size="sm" asChild className="mb-2">
          <Link href="/products">
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Back to products
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New product</h1>
        <p className="text-sm text-muted-foreground">
          A product needs at least one variant — the sellable, stockable unit that carries the SKU.
        </p>
      </header>

      <CreateProductForm />
    </div>
  );
}
