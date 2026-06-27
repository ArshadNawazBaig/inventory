import { describe, it, expect } from 'vitest';
import type { ListProductsQuery } from '@stockflow/types';
import { productKeys } from './query-keys';

const query: ListProductsQuery = { page: 1, limit: 20, sort: '-createdAt' };

describe('productKeys', () => {
  it('roots everything under "products"', () => {
    expect(productKeys.all).toEqual(['products']);
  });

  it('nests lists and includes the query in the list key', () => {
    expect(productKeys.lists()).toEqual(['products', 'list']);
    expect(productKeys.list(query)).toEqual(['products', 'list', query]);
  });

  it('builds hierarchical detail + variants keys', () => {
    expect(productKeys.detail('p1')).toEqual(['products', 'detail', 'p1']);
    expect(productKeys.variants('p1')).toEqual(['products', 'detail', 'p1', 'variants']);
  });
});
