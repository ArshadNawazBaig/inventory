import { useMemo } from 'react';

/**
 * One slot in a rendered pagination control: a concrete page number, or a gap marker. Two distinct
 * ellipsis tokens keep React keys stable (there is at most one of each).
 */
export type PaginationRangeItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface GetPaginationRangeOptions {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages to show on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the very start and very end. */
  boundaryCount?: number;
}

const range = (start: number, end: number): number[] =>
  start > end ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

/**
 * Compute which page numbers (and ellipses) to render. Pure — derives the windowed range from the
 * current page, total pages, sibling and boundary counts. An ellipsis only replaces a *gap of more
 * than one page*; a single hidden page is shown as the number itself (no pointless "…").
 */
export function getPaginationRange({
  page,
  pageCount,
  siblingCount = 1,
  boundaryCount = 1,
}: GetPaginationRangeOptions): PaginationRangeItem[] {
  if (pageCount <= 0) return [];

  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );

  const firstEndPage = endPages.length > 0 ? endPages[0] : undefined;
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    firstEndPage !== undefined ? firstEndPage - 2 : pageCount - 1,
  );

  const items: PaginationRangeItem[] = [...startPages];

  // Gap (or single bridging page) between the start boundary and the sibling window.
  if (siblingsStart > boundaryCount + 2) {
    items.push('start-ellipsis');
  } else if (boundaryCount + 1 < pageCount - boundaryCount) {
    items.push(boundaryCount + 1);
  }

  items.push(...range(siblingsStart, siblingsEnd));

  // Gap (or single bridging page) between the sibling window and the end boundary.
  if (siblingsEnd < pageCount - boundaryCount - 1) {
    items.push('end-ellipsis');
  } else if (pageCount - boundaryCount > boundaryCount) {
    items.push(pageCount - boundaryCount);
  }

  items.push(...endPages);

  return items;
}

/** Memoized hook wrapper around {@link getPaginationRange}. */
export function usePaginationRange(options: GetPaginationRangeOptions): PaginationRangeItem[] {
  const { page, pageCount, siblingCount, boundaryCount } = options;
  return useMemo(
    () =>
      getPaginationRange({
        page,
        pageCount,
        // exactOptionalPropertyTypes: only forward these when set, never as explicit undefined.
        ...(siblingCount !== undefined ? { siblingCount } : {}),
        ...(boundaryCount !== undefined ? { boundaryCount } : {}),
      }),
    [page, pageCount, siblingCount, boundaryCount],
  );
}
