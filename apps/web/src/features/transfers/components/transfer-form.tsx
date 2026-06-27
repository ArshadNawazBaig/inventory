'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Textarea, toast } from '@stockflow/ui';
import { AddIcon, DeleteIcon } from '@stockflow/icons';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { VariantPicker } from '@/features/inventory/components/variant-picker';
import { LocationPicker } from '@/features/inventory/components/location-picker';
import { useCreateTransfer } from '../mutations';
import {
  emptyTransferForm,
  emptyTransferLine,
  toCreateTransfer,
  transferFormSchema,
  type TransferFormValues,
} from '../lib/forms';

/** Create-a-draft-transfer page body — source/destination location pickers + a dynamic line editor. */
export function TransferForm() {
  const router = useRouter();
  const create = useCreateTransfer();
  const formId = useId();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: emptyTransferForm,
    mode: 'onBlur',
  });
  const lines = useFieldArray({ control, name: 'lines' });

  const submit = handleSubmit(async (values) => {
    try {
      const transfer = await create.mutateAsync(toCreateTransfer(values));
      toast.success(`Created ${transfer.transferNumber}`);
      router.push(`/transfers/${transfer.id}`);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(mapped ? 'Please fix the highlighted fields.' : errorMessage(error));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New transfer</h1>
        <p className="text-sm text-muted-foreground">Move stock from one location to another.</p>
      </header>

      <form id={formId} onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <section className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="sourceLocationId"
            render={({ field }) => (
              <LocationPicker
                label="Source"
                value={field.value}
                onChange={field.onChange}
                error={errors.sourceLocationId?.message}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="destinationLocationId"
            render={({ field }) => (
              <LocationPicker
                label="Destination"
                value={field.value}
                onChange={field.onChange}
                error={errors.destinationLocationId?.message}
                disabled={isSubmitting}
              />
            )}
          />
          <Field label="Note" error={errors.note?.message} className="sm:col-span-2">
            <FieldControl>
              <Textarea rows={2} disabled={isSubmitting} {...register('note')} />
            </FieldControl>
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Lines</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leadingIcon={AddIcon}
              onClick={() => lines.append({ ...emptyTransferLine })}
            >
              Add line
            </Button>
          </div>
          {typeof errors.lines?.message === 'string' ? (
            <p className="text-sm text-destructive">{errors.lines.message}</p>
          ) : null}

          {lines.fields.map((fieldRow, index) => (
            <div key={fieldRow.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name={`lines.${index}.variantId`}
                    render={({ field }) => (
                      <VariantPicker
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.lines?.[index]?.variantId?.message}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
                <Field label="Qty" required error={errors.lines?.[index]?.qty?.message} className="sm:w-24">
                  <FieldControl>
                    <Input inputMode="numeric" disabled={isSubmitting} {...register(`lines.${index}.qty`)} />
                  </FieldControl>
                </Field>
                <div className="sm:pt-7">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leadingIcon={DeleteIcon}
                    onClick={() => lines.remove(index)}
                    disabled={lines.fields.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="flex justify-end">
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…">
            Create transfer
          </Button>
        </div>
      </form>
    </div>
  );
}
