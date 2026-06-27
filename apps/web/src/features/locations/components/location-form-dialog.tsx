'use client';

import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  toast,
} from '@stockflow/ui';
import type { LocationResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { useCreateLocation, useUpdateLocation } from '../mutations';
import {
  LOCATION_TYPE_OPTIONS,
  emptyLocationForm,
  locationFormSchema,
  locationToForm,
  toCreateLocation,
  toUpdateLocation,
  type LocationFormValues,
} from '../lib/forms';
import { LocationSelect } from './location-select';

export interface LocationFormDialogProps {
  open: boolean;
  editing: LocationResponse | null;
  warehouseId: string;
  warehouseName: string;
  onOpenChange: (open: boolean) => void;
}

export function LocationFormDialog({
  open,
  editing,
  warehouseId,
  warehouseName,
  onOpenChange,
}: LocationFormDialogProps) {
  const formId = useId();
  const isEdit = Boolean(editing);
  const create = useCreateLocation();
  const update = useUpdateLocation();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: emptyLocationForm,
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
    if (open) reset(editing ? locationToForm(editing) : emptyLocationForm);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: toUpdateLocation(values) });
        toast.success('Location updated');
      } else {
        await create.mutateAsync(toCreateLocation(values, warehouseId));
        toast.success('Location created');
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
      title={isEdit ? 'Edit location' : 'New location'}
      description={`In ${warehouseName}. Nest under a parent to build the zone → bin tree.`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            {isEdit ? 'Save location' : 'Create location'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4 py-2" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name?.message}>
            <FieldControl>
              <Input autoComplete="off" disabled={isSubmitting} {...register('name')} />
            </FieldControl>
          </Field>
          <Field label="Code" description="Unique within this warehouse" required error={errors.code?.message}>
            <FieldControl>
              <Input autoComplete="off" disabled={isSubmitting} {...register('code')} />
            </FieldControl>
          </Field>
        </div>

        <Field label="Type" error={errors.type?.message}>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <FieldControl>
                  <SelectTrigger placeholder="Type" />
                </FieldControl>
                <SelectContent>
                  {LOCATION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Parent location"
          description="Optional — nest under another location in this warehouse."
          error={errors.parentLocationId?.message}
        >
          <Controller
            control={control}
            name="parentLocationId"
            render={({ field }) => (
              <LocationSelect
                warehouseId={warehouseId}
                value={field.value}
                onChange={field.onChange}
                excludeId={editing?.id}
              />
            )}
          />
        </Field>
      </form>
    </Modal>
  );
}
