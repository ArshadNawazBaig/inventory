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
  Switch,
  toast,
} from '@stockflow/ui';
import type { WarehouseResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { AddressFields } from '@/components/address-fields';
import { useCreateResource, useUpdateResource } from '@/features/resources/mutations';
import { WAREHOUSES } from '../descriptors';
import {
  SITE_TYPE_OPTIONS,
  emptyWarehouseForm,
  toCreateWarehouse,
  toUpdateWarehouse,
  warehouseFormSchema,
  warehouseToForm,
  type WarehouseFormValues,
} from '../lib/forms';

export interface WarehouseFormDialogProps {
  open: boolean;
  editing: WarehouseResponse | null;
  onOpenChange: (open: boolean) => void;
}

export function WarehouseFormDialog({ open, editing, onOpenChange }: WarehouseFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateResource(WAREHOUSES);
  const update = useUpdateResource(WAREHOUSES);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: emptyWarehouseForm,
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
    if (open) reset(editing ? warehouseToForm(editing) : emptyWarehouseForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateWarehouse(values) });
        toast.success('Warehouse updated');
      } else {
        await create.mutateAsync(toCreateWarehouse(values));
        toast.success('Warehouse created');
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
      title={isEdit ? 'Edit site' : 'New site'}
      description="A warehouse (back-stock) or a retail store — both hold stock."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save warehouse' : 'Create warehouse'}
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
          <Field
            label="Type"
            description="A store sells from its own stock via Point-of-Sale."
            error={errors.type?.message}
          >
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                  <SelectTrigger aria-label="Site type" placeholder="Type" />
                  <SelectContent>
                    {SITE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Field label="Code" description="Optional unique key, e.g. WH-MAIN" error={errors.code?.message}>
          <FieldControl>
            <Input autoComplete="off" disabled={isSubmitting} {...register('code')} />
          </FieldControl>
        </Field>

        <Field
          label="Default site"
          description="Used as the default for receiving and fulfilment. Only one warehouse can be the default."
          error={errors.isDefault?.message}
        >
          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
                aria-label="Set as default site"
              />
            )}
          />
        </Field>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Address</h3>
          <AddressFields
            register={(key) => register(`address.${key}` as Path<WarehouseFormValues>)}
            errorFor={(key) => errors.address?.[key]?.message}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}
