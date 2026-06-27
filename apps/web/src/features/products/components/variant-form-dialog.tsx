'use client';

import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal, toast } from '@stockflow/ui';
import type { VariantResponse } from '@stockflow/types';
import {
  emptyVariantForm,
  toCreateVariant,
  toUpdateVariantRequest,
  variantFormSchema,
  variantToFormValues,
  type VariantFormValues,
} from '../lib/product-form.schema';
import { applyApiErrorToForm } from '@/lib/forms';
import { errorMessage } from '@/lib/api';
import { useAddVariant, useUpdateVariant } from '../mutations';
import { VariantFields } from './variant-fields';

export interface VariantFormDialogProps {
  productId: string;
  /** Present → edit that variant; absent → add a new one. */
  variant?: VariantResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Add or edit a single variant in a modal. Shares the variant field layout + mappers with create. */
export function VariantFormDialog({ productId, variant, open, onOpenChange }: VariantFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(variant);
  const addMutation = useAddVariant();
  const updateMutation = useUpdateVariant();

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: variant ? variantToFormValues(variant) : { ...emptyVariantForm },
    mode: 'onBlur',
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // Refresh the form to the current target whenever the dialog opens.
  useEffect(() => {
    if (open) reset(variant ? variantToFormValues(variant) : { ...emptyVariantForm });
  }, [open, variant, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (variant) {
        await updateMutation.mutateAsync({
          productId,
          variantId: variant.id,
          input: toUpdateVariantRequest(values),
        });
        toast.success('Variant updated', { description: values.sku.toUpperCase() });
      } else {
        await addMutation.mutateAsync({ productId, input: toCreateVariant(values) });
        toast.success('Variant added', { description: values.sku.toUpperCase() });
      }
      onOpenChange(false);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(mapped ? 'Please fix the highlighted fields.' : errorMessage(error));
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? 'Edit variant' : 'Add variant'}
      description={
        isEdit ? 'Update this variant’s details.' : 'Create a new sellable unit for this product.'
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save variant' : 'Add variant'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="py-2" noValidate>
        <VariantFields
          register={(key) => register(key)}
          errorFor={(key) => errors[key]?.message}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
}
