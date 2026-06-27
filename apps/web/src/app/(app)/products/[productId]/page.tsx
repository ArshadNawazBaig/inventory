import type { Metadata } from 'next';
import { ProductDetail } from '@/features/products/components/product-detail';

export const metadata: Metadata = { title: 'Product · StockFlow' };

/** Product detail — summary, variant management, and lifecycle actions. */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetail productId={productId} />;
}
