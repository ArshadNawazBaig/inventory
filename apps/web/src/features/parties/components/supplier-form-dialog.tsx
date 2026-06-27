'use client';

import { useEffect, useId } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Modal, Textarea, toast } from '@stockflow/ui';
import type { SupplierResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { useCreateResource, useUpdateResource } from '@/features/resources/mutations';
import { SUPPLIERS } from '../descriptors';
import {
  emptySupplierForm,
  supplierFormSchema,
  supplierToForm,
  toCreateSupplier,
  toUpdateSupplier,
  type SupplierFormValues,
} from '../lib/forms';
import { PartyContactFields } from './party-contact-fields';
import { AddressFields } from './address-fields';

export interface SupplierFormDialogProps {
  open: boolean;
  editing: SupplierResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function SupplierFormDialog({ open, editing, onOpenChange }: SupplierFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateResource(SUPPLIERS);
  const update = useUpdateResource(SUPPLIERS);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: emptySupplierForm,
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
    if (open) reset(editing ? supplierToForm(editing) : emptySupplierForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateSupplier(values) });
        toast.success('Supplier updated');
      } else {
        await create.mutateAsync(toCreateSupplier(values));
        toast.success('Supplier created');
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
      size="xl"
      title={isEdit ? 'Edit supplier' : 'New supplier'}
      description="A vendor you purchase from."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save supplier' : 'Create supplier'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto py-2 pr-1"
        noValidate
      >
        <Field label="Name" required error={errors.name?.message}>
          <FieldControl>
            <Input autoComplete="off" disabled={isSubmitting} {...register('name')} />
          </FieldControl>
        </Field>

        <PartyContactFields
          register={(key) => register(key)}
          errorFor={(key) => errors[key]?.message}
          disabled={isSubmitting}
        />

        <Field label="Notes" error={errors.notes?.message}>
          <FieldControl>
            <Textarea rows={3} disabled={isSubmitting} {...register('notes')} />
          </FieldControl>
        </Field>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Address</h3>
          <AddressFields
            register={(key) => register(`address.${key}` as Path<SupplierFormValues>)}
            errorFor={(key) => errors.address?.[key]?.message}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Terms</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Currency" description="ISO-4217" error={errors.currency?.message}>
              <FieldControl>
                <Input maxLength={3} placeholder="USD" disabled={isSubmitting} {...register('currency')} />
              </FieldControl>
            </Field>
            <Field label="Payment terms" error={errors.paymentTerms?.message}>
              <FieldControl>
                <Input placeholder="NET30" disabled={isSubmitting} {...register('paymentTerms')} />
              </FieldControl>
            </Field>
            <Field label="Lead time (days)" error={errors.leadTimeDays?.message}>
              <FieldControl>
                <Input inputMode="numeric" placeholder="7" disabled={isSubmitting} {...register('leadTimeDays')} />
              </FieldControl>
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
