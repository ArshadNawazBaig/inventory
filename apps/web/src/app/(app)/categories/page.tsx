import type { Metadata } from 'next';
import { CategoryAdmin } from '@/features/lookups/components/category-admin';

export const metadata: Metadata = { title: 'Categories · StockFlow' };

export default function CategoriesPage() {
  return <CategoryAdmin />;
}
