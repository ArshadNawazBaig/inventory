'use client';

import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Modal, toast } from '@stockflow/ui';
import type { BrandResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { BRANDS } from '../descriptors';
import { useCreateLookup, useUpdateLookup } from '../mutations';
import {
  brandFormSchema,
  brandToForm,
  emptyBrandForm,
  toCreateBrand,
  toUpdateBrand,
  type BrandFormValues,
} from '../lib/forms';
import { LookupBaseFields } from './lookup-base-fields';

export interface BrandFormDialogProps {
  open: boolean;
  editing: BrandResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function BrandFormDialog({ open, editing, onOpenChange }: BrandFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateLookup(BRANDS);
  const update = useUpdateLookup(BRANDS);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: emptyBrandForm,
    mode: 'onBlur',
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(editing ? brandToForm(editing) : emptyBrandForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateBrand(values) });
        toast.success('Brand updated');
      } else {
        await create.mutateAsync(toCreateBrand(values));
        toast.success('Brand created');
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
      size="md"
      title={isEdit ? 'Edit brand' : 'New brand'}
      description="Brands identify the maker of a product."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save brand' : 'Create brand'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4 py-2" noValidate>
        <LookupBaseFields
          register={(key) => register(key)}
          errorFor={(key) => errors[key]?.message}
          disabled={isSubmitting}
        />
        <Field label="Website" description="Optional URL." error={errors.website?.message}>
          <FieldControl>
            <Input placeholder="https://…" inputMode="url" disabled={isSubmitting} {...register('website')} />
          </FieldControl>
        </Field>
      </form>
    </Modal>
  );
}
