'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSale, listSales } from './api';

const SALES_KEY = ['pos', 'sales'] as const;

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      // The sale moved stock — refresh the receipt history and any inventory views.
      void queryClient.invalidateQueries({ queryKey: SALES_KEY });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useRecentSales() {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: ({ signal }) => listSales({ page: 1, limit: 10, sort: '-createdAt' }, signal),
  });
}
