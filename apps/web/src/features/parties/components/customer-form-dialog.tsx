'use client';

import { useEffect, useId } from 'react';
import { Controller, useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Field,
  FieldControl,
  Input,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
  toast,
} from '@stockflow/ui';
import type { CustomerResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { useCreateResource, useUpdateResource } from '@/features/resources/mutations';
import { CUSTOMERS } from '../descriptors';
import {
  customerFormSchema,
  customerToForm,
  emptyCustomerForm,
  toCreateCustomer,
  toUpdateCustomer,
  type CustomerFormValues,
} from '../lib/forms';
import { AddressFields } from '@/components/address-fields';
import { PartyContactFields } from './party-contact-fields';

export interface CustomerFormDialogProps {
  open: boolean;
  editing: CustomerResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function CustomerFormDialog({ open, editing, onOpenChange }: CustomerFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateResource(CUSTOMERS);
  const update = useUpdateResource(CUSTOMERS);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: emptyCustomerForm,
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
    if (open) reset(editing ? customerToForm(editing) : emptyCustomerForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateCustomer(values) });
        toast.success('Customer updated');
      } else {
        await create.mutateAsync(toCreateCustomer(values));
        toast.success('Customer created');
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
      title={isEdit ? 'Edit customer' : 'New customer'}
      description="A buyer you sell to."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save customer' : 'Create customer'}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name?.message}>
            <FieldControl>
              <Input autoComplete="off" disabled={isSubmitting} {...register('name')} />
            </FieldControl>
          </Field>
          <Field label="Customer type" error={errors.customerType?.message}>
            <Controller
              control={control}
              name="customerType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <FieldControl>
                    <SelectTrigger placeholder="Type" />
                  </FieldControl>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

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
            register={(key) => register(`address.${key}` as Path<CustomerFormValues>)}
            errorFor={(key) => errors.address?.[key]?.message}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Billing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credit limit" description="Major units, e.g. 1000.00" error={errors.creditLimit?.message}>
              <FieldControl>
                <Input inputMode="decimal" placeholder="0.00" disabled={isSubmitting} {...register('creditLimit')} />
              </FieldControl>
            </Field>
            <Field label="Currency" description="ISO-4217" error={errors.currency?.message}>
              <FieldControl>
                <Input maxLength={3} placeholder="USD" disabled={isSubmitting} {...register('currency')} />
              </FieldControl>
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
