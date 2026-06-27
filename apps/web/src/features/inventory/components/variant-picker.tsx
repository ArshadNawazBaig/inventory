'use client';

import { useState } from 'react';
import { Field, FieldControl, Select, SelectContent, SelectItem, SelectTrigger } from '@stockflow/ui';
import { useProducts, useVariants } from '@/features/products/queries';

export interface VariantPickerProps {
  value: string;
  onChange: (variantId: string) => void;
  error?: string | undefined;
  disabled?: boolean;
}

/**
 * Cascading Product → Variant selector. Products and variants live in the Catalog module; this resolves a
 * concrete `variantId` to stock against. Two labelled `Field`s so each select is accessible.
 */
export function VariantPicker({ value, onChange, error, disabled = false }: VariantPickerProps) {
  const [productId, setProductId] = useState('');
  const products = useProducts({ page: 1, limit: 100, sort: 'name' });
  const variants = useVariants(productId || undefined);

  const productItems = products.data?.data ?? [];
  const variantItems = variants.data ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Product">
        <Select
          value={productId}
          onValueChange={(next) => {
            setProductId(next);
            onChange(''); // reset the variant when the product changes
          }}
          disabled={disabled || products.isLoading}
        >
          <FieldControl>
            <SelectTrigger placeholder={products.isLoading ? 'Loading…' : 'Select a product'} />
          </FieldControl>
          <SelectContent>
            {productItems.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Variant" error={error}>
        <Select value={value} onValueChange={onChange} disabled={disabled || !productId || variants.isLoading}>
          <FieldControl>
            <SelectTrigger placeholder={productId ? 'Select a variant' : 'Pick a product first'} />
          </FieldControl>
          <SelectContent>
            {variantItems.map((variant) => (
              <SelectItem key={variant.id} value={variant.id}>
                {variant.sku}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
