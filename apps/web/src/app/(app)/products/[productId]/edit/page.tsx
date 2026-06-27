import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@stockflow/ui';
import { ChevronLeftIcon } from '@stockflow/icons';
import { EditProductView } from '@/features/products/components/edit-product-view';

export const metadata: Metadata = { title: 'Edit product · StockFlow' };

/** Edit a product's own fields (variants/status are managed on the detail page). */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <Button variant="link" size="sm" asChild className="mb-2">
          <Link href={`/products/${productId}`}>
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Back to product
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Edit product</h1>
      </header>

      <EditProductView productId={productId} />
    </div>
  );
}
