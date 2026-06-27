'use client';

import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Modal, toast } from '@stockflow/ui';
import type { CategoryResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { useCreateResource, useUpdateResource } from '@/features/resources/mutations';
import { ResourceSelect } from '@/features/resources/components/resource-select';
import { CATEGORIES } from '../descriptors';
import {
  categoryFormSchema,
  categoryToForm,
  emptyCategoryForm,
  toCreateCategory,
  toUpdateCategory,
  type CategoryFormValues,
} from '../lib/forms';
import { LookupBaseFields } from './lookup-base-fields';

export interface CategoryFormDialogProps {
  open: boolean;
  editing: CategoryResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function CategoryFormDialog({ open, editing, onOpenChange }: CategoryFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateResource(CATEGORIES);
  const update = useUpdateResource(CATEGORIES);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: emptyCategoryForm,
    mode: 'onBlur',
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(editing ? categoryToForm(editing) : emptyCategoryForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateCategory(values) });
        toast.success('Category updated');
      } else {
        await create.mutateAsync(toCreateCategory(values));
        toast.success('Category created');
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
      title={isEdit ? 'Edit category' : 'New category'}
      description="Categories classify products and can be nested."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save category' : 'Create category'}
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
        <Field
          label="Parent category"
          description="Optional — nest under another category."
          error={errors.parentId?.message}
        >
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <ResourceSelect
                descriptor={CATEGORIES}
                value={field.value}
                onChange={field.onChange}
                includeNone
                placeholder="No parent"
              />
            )}
          />
        </Field>
      </form>
    </Modal>
  );
}
