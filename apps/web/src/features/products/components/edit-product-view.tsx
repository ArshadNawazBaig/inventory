'use client';

import Link from 'next/link';
import { Button, Skeleton } from '@stockflow/ui';
import { ErrorState } from '@/components/errors';
import { ApiError, errorMessage } from '@/lib/api';
import { useProduct } from '../queries';
import { EditProductForm } from './product-form';

/** Loads the product, then renders the edit form prefilled. Handles loading / not-found / error. */
export function EditProductView({ productId }: { productId: string }) {
  const { data: product, isLoading, isError, error, refetch } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <ErrorState
          title="Product not found"
          description="It may have been deleted, or it belongs to another organization."
        >
          <Button variant="outline" asChild className="mt-2">
            <Link href="/products">Back to products</Link>
          </Button>
        </ErrorState>
      );
    }
    return (
      <ErrorState
        title="Couldn’t load this product"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!product) return null;

  return <EditProductForm product={product} />;
}
