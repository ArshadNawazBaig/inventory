'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  toast,
} from '@stockflow/ui';
import { AddIcon, DeleteIcon } from '@stockflow/icons';
import type { ProductResponse } from '@stockflow/types';
import {
  createProductFormSchema,
  emptyCreateProductForm,
  emptyVariantForm,
  productDetailsSchema,
  productToDetailsValues,
  toCreateProductRequest,
  toUpdateProductRequest,
  type CreateProductFormValues,
  type ProductDetailsValues,
  type VariantFormValues,
} from '../lib/product-form.schema';
import { applyApiErrorToForm } from '../lib/form-errors';
import { errorMessage } from '@/lib/api';
import { useCreateProduct, useUpdateProduct } from '../mutations';
import { ProductDetailsFields } from './product-details-fields';
import { VariantFields } from './variant-fields';

type VariantFieldKey = keyof VariantFormValues;

/** Toast description carrying the server requestId, when present, for support correlation. */
function withRequestId(error: unknown): { description: string } | undefined {
  const requestId =
    typeof error === 'object' && error !== null && 'requestId' in error
      ? (error as { requestId?: string }).requestId
      : undefined;
  return requestId ? { description: `Request ${requestId}` } : undefined;
}

// ─── Create ───────────────────────────────────────────────────────────────────

/** Create a product together with its initial variant(s). The API persists both in one transaction. */
export function CreateProductForm() {
  const router = useRouter();
  const createMutation = useCreateProduct();

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: { ...emptyCreateProductForm, variants: [{ ...emptyVariantForm }] },
    mode: 'onBlur',
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const product = await createMutation.mutateAsync(toCreateProductRequest(values));
      toast.success('Product created', { description: `“${product.name}” was saved as a draft.` });
      router.push(`/products/${product.id}`);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(
        mapped ? 'Please fix the highlighted fields.' : errorMessage(error),
        withRequestId(error),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>Product details</CardTitle>
          <CardDescription>The catalog parent. It goes live once you publish it.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductDetailsFields
            register={(key) => register(key)}
            errorFor={(key) => errors[key]?.message}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Variants</h2>
            <p className="text-sm text-muted-foreground">
              The sellable, stockable units. Each carries a unique SKU.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leadingIcon={AddIcon}
            onClick={() => append({ ...emptyVariantForm })}
            disabled={isSubmitting}
          >
            Add variant
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="flex-row items-center justify-between pt-6">
              <CardTitle className="text-sm">Variant {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leadingIcon={DeleteIcon}
                onClick={() => remove(index)}
                disabled={isSubmitting || fields.length === 1}
                aria-label={`Remove variant ${index + 1}`}
              >
                Remove
              </Button>
            </CardHeader>
            <CardContent>
              <VariantFields
                register={(key) =>
                  register(`variants.${index}.${key}` as FieldPath<CreateProductFormValues>)
                }
                errorFor={(key) => errors.variants?.[index]?.[key]?.message}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/products">Cancel</Link>
        </Button>
        <Button type="submit" loading={isSubmitting} loadingText="Creating…">
          Create product
        </Button>
      </div>
    </form>
  );
}

// ─── Edit ───────────────────────────────────────────────────────────────────

/** Edit a product's own fields. Variants and status are managed on the detail page. */
export function EditProductForm({ product }: { product: ProductResponse }) {
  const router = useRouter();
  const updateMutation = useUpdateProduct();

  const form = useForm<ProductDetailsValues>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: productToDetailsValues(product),
    mode: 'onBlur',
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        productId: product.id,
        input: toUpdateProductRequest(values),
      });
      toast.success('Product updated', { description: `“${values.name}” was saved.` });
      router.push(`/products/${product.id}`);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(
        mapped ? 'Please fix the highlighted fields.' : errorMessage(error),
        withRequestId(error),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>Product details</CardTitle>
          <CardDescription>Update the catalog parent. SKUs are managed per variant.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductDetailsFields
            register={(key) => register(key)}
            errorFor={(key) => errors[key]?.message}
            disabled={isSubmitting}
          />
        </CardContent>
        <CardFooter className="justify-end gap-3 pb-6 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/products/${product.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Saving…">
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export type { VariantFieldKey };
