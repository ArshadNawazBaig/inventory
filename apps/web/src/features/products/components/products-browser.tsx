'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@stockflow/ui';
import { ListProductsQuerySchema, type ProductStatus } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useProducts } from '../queries';
import { ProductFilters } from './product-filters';
import { ProductsTable, type ProductSort } from './products-table';

/** Read the list query from the URL, coercing + validating via the shared schema (falls back to defaults). */
function useListQueryFromUrl(searchParams: URLSearchParams) {
  const parsed = ListProductsQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    q: searchParams.get('q') ?? undefined,
  });
  return parsed.success ? parsed.data : ListProductsQuerySchema.parse({});
}

/**
 * Stateful product list: filters + sort + pagination are kept in the URL (shareable, back-button
 * friendly), fed into the TanStack Query hook, and rendered through the presentational table. Wrapped in
 * a Suspense boundary by the page because it reads `useSearchParams`.
 */
export function ProductsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useListQueryFromUrl(searchParams);

  const { data, isLoading, isError, error, refetch } = useProducts(query);

  function setParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  // Filter/sort changes reset paging to page 1 (drop the param → default).
  const onSearch = (q: string) => setParams({ q: q || undefined, page: undefined });
  const onStatusChange = (status: ProductStatus | undefined) =>
    setParams({ status, page: undefined });
  const onSortChange = (sort: ProductSort) => setParams({ sort, page: undefined });
  const onPageChange = (page: number) => setParams({ page: String(page) });

  const products = data?.data ?? [];
  const meta = data?.meta.page;

  return (
    <div className="flex flex-col gap-4">
      <ProductFilters
        q={query.q ?? ''}
        status={query.status}
        onSearch={onSearch}
        onStatusChange={onStatusChange}
      />

      {isError ? (
        <ErrorState
          title="Couldn’t load products"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <ProductsTable
            products={products}
            loading={isLoading}
            sort={query.sort}
            onSortChange={onSortChange}
          />

          {meta && meta.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {meta.total} {meta.total === 1 ? 'product' : 'products'}
              </p>
              {meta.totalPages > 1 ? (
                <Pagination
                  page={meta.page}
                  pageCount={meta.totalPages}
                  onPageChange={onPageChange}
                  size="sm"
                />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
