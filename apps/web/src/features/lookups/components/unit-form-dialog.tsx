'use client';

import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Modal, toast } from '@stockflow/ui';
import type { UnitResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { UNITS } from '../descriptors';
import { useCreateLookup, useUpdateLookup } from '../mutations';
import {
  emptyUnitForm,
  toCreateUnit,
  toUpdateUnit,
  unitFormSchema,
  unitToForm,
  type UnitFormValues,
} from '../lib/forms';
import { LookupBaseFields } from './lookup-base-fields';

export interface UnitFormDialogProps {
  open: boolean;
  editing: UnitResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function UnitFormDialog({ open, editing, onOpenChange }: UnitFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateLookup(UNITS);
  const update = useUpdateLookup(UNITS);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: emptyUnitForm,
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
    if (open) reset(editing ? unitToForm(editing) : emptyUnitForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateUnit(values) });
        toast.success('Unit updated');
      } else {
        await create.mutateAsync(toCreateUnit(values));
        toast.success('Unit created');
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
      title={isEdit ? 'Edit unit' : 'New unit'}
      description="Units of measure used by products and variants."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save unit' : 'Create unit'}
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
        <Field label="Code" required description="Short symbol, e.g. kg, ea, cm." error={errors.code?.message}>
          <FieldControl>
            <Input placeholder="kg" maxLength={16} autoComplete="off" disabled={isSubmitting} {...register('code')} />
          </FieldControl>
        </Field>
      </form>
    </Modal>
  );
}
