'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@stockflow/ui';
import { AddIcon, ChevronLeftIcon, DeleteIcon, EditIcon } from '@stockflow/icons';
import type { VariantResponse } from '@stockflow/types';
import { formatMoneyMinor } from '@stockflow/utils';
import { ErrorState } from '@/components/errors';
import { ApiError, errorMessage } from '@/lib/api';
import { useProduct } from '../queries';
import {
  useArchiveProduct,
  useDeleteProduct,
  useDeleteVariant,
  useRestoreProduct,
} from '../mutations';
import { ProductStatusBadge, VariantStatusBadge } from './status-badge';
import { VariantFormDialog } from './variant-form-dialog';
import { ConfirmDialog } from './confirm-dialog';

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function formatPrice(variant: VariantResponse): string {
  if (variant.defaultPriceMinor == null) return '—';
  return formatMoneyMinor(variant.defaultPriceMinor, variant.currency ?? 'USD');
}

type ProductConfirm = 'archive' | 'restore' | 'delete';

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: product, isLoading, isError, error, refetch } = useProduct(productId);

  const archiveMutation = useArchiveProduct();
  const restoreMutation = useRestoreProduct();
  const deleteMutation = useDeleteProduct();
  const deleteVariantMutation = useDeleteVariant();

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantResponse | undefined>(undefined);
  const [confirm, setConfirm] = useState<ProductConfirm | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<VariantResponse | null>(null);

  if (isLoading) return <ProductDetailSkeleton />;

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

  const variants = product.variants ?? [];
  const isArchived = product.status === 'archived';

  function openAddVariant() {
    setEditingVariant(undefined);
    setVariantDialogOpen(true);
  }
  function openEditVariant(variant: VariantResponse) {
    setEditingVariant(variant);
    setVariantDialogOpen(true);
  }

  async function runArchive() {
    try {
      await archiveMutation.mutateAsync(productId);
      toast.success('Product archived');
      setConfirm(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runRestore() {
    try {
      await restoreMutation.mutateAsync(productId);
      toast.success('Product restored');
      setConfirm(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runDelete() {
    try {
      await deleteMutation.mutateAsync(productId);
      toast.success('Product deleted');
      setConfirm(null);
      router.push('/products');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function runDeleteVariant() {
    if (!variantToDelete) return;
    try {
      await deleteVariantMutation.mutateAsync({ productId, variantId: variantToDelete.id });
      toast.success('Variant deleted', { description: variantToDelete.sku });
      setVariantToDelete(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="link" size="sm" asChild className="mb-2">
          <Link href="/products">
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Back to products
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/products/${product.id}/edit`}>
                <EditIcon className="size-4" aria-hidden="true" />
                Edit
              </Link>
            </Button>
            {isArchived ? (
              <Button variant="outline" onClick={() => setConfirm('restore')}>
                Restore
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirm('archive')}>
                Archive
              </Button>
            )}
            <Button variant="destructive" leadingIcon={DeleteIcon} onClick={() => setConfirm('delete')}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pt-6">
          <CardTitle className="text-base">Details</CardTitle>
          {product.description ? (
            <CardDescription>{product.description}</CardDescription>
          ) : (
            <CardDescription>No description.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <DetailRow label="Base unit" value={product.baseUnitId} mono />
            <DetailRow label="Variants" value={String(product.variantCount)} />
            <DetailRow label="Category" value={product.categoryId ?? '—'} mono={Boolean(product.categoryId)} />
            <DetailRow label="Brand" value={product.brandId ?? '—'} mono={Boolean(product.brandId)} />
            <DetailRow label="Created" value={formatDate(product.createdAt)} />
            <DetailRow label="Updated" value={formatDate(product.updatedAt)} />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Variants</h2>
            <p className="text-sm text-muted-foreground">Sellable units. Each carries a unique SKU.</p>
          </div>
          <Button variant="outline" size="sm" leadingIcon={AddIcon} onClick={openAddVariant}>
            Add variant
          </Button>
        </div>

        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Reorder pt</TableHead>
                <TableHead className="text-right">Reorder qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    No variants yet.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.sku}</TableCell>
                    <TableCell className="text-muted-foreground">{variant.barcode ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPrice(variant)}</TableCell>
                    <TableCell className="text-right tabular-nums">{variant.reorderPoint}</TableCell>
                    <TableCell className="text-right tabular-nums">{variant.reorderQty}</TableCell>
                    <TableCell>
                      <VariantStatusBadge status={variant.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={EditIcon}
                          onClick={() => openEditVariant(variant)}
                          aria-label={`Edit variant ${variant.sku}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={DeleteIcon}
                          onClick={() => setVariantToDelete(variant)}
                          aria-label={`Delete variant ${variant.sku}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <VariantFormDialog
        productId={productId}
        {...(editingVariant ? { variant: editingVariant } : {})}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
      />

      <ConfirmDialog
        open={confirm === 'archive'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Archive this product?"
        description="It will be hidden from pickers but kept for history and reports. You can restore it later."
        confirmLabel="Archive"
        loading={archiveMutation.isPending}
        onConfirm={runArchive}
      />
      <ConfirmDialog
        open={confirm === 'restore'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Restore this product?"
        description="It becomes selectable again."
        confirmLabel="Restore"
        loading={restoreMutation.isPending}
        onConfirm={runRestore}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete this product?"
        description="Soft-deletes the product. Blocked if any variant still holds stock or open orders — archive instead."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={runDelete}
      />
      <ConfirmDialog
        open={variantToDelete !== null}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
        title="Delete this variant?"
        description={
          variantToDelete
            ? `Deletes ${variantToDelete.sku}. You can’t delete the last variant of a product.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteVariantMutation.isPending}
        onConfirm={runDeleteVariant}
      />
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs text-foreground' : 'text-foreground'}>{value}</dd>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardContent className="space-y-3 py-6">
          <Skeleton variant="text" className="max-w-md" />
          <Skeleton variant="text" className="max-w-sm" />
        </CardContent>
      </Card>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
