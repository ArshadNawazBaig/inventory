'use client';

import { useId } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Textarea, toast } from '@stockflow/ui';
import { AddIcon, DeleteIcon } from '@stockflow/icons';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import type { ResourceDescriptor } from '@/features/resources/descriptor';
import type { ResourceRecord } from '@/features/resources/types';
import { ResourceSelect } from '@/features/resources/components/resource-select';
import { WAREHOUSES } from '@/features/locations/descriptors';
import type { WarehouseResponse } from '@stockflow/types';
import { VariantPicker } from '@/features/inventory/components/variant-picker';
import {
  emptyOrderForm,
  emptyOrderLine,
  orderFormSchema,
  type OrderFormValues,
} from '../lib/order-form';

export interface OrderFormProps<TParty extends ResourceRecord> {
  partyDescriptor: ResourceDescriptor<TParty>;
  partyLabel: string;
  moneyLabel: string;
  showExpectedAt: boolean;
  submitLabel: string;
  /** Maps the shared form values to a request + creates the order; resolves when done (dialog/page closes). */
  onSubmit: (values: OrderFormValues) => Promise<void>;
}

/**
 * Generic create-order form (one form, two configs — Purchasing & Sales). Header (party + warehouse +
 * currency [+ expected date]) plus a dynamic line editor (variant picker + qty + unit money). The concrete
 * module supplies the party descriptor, labels and the submit mapper.
 */
export function OrderForm<TParty extends ResourceRecord>({
  partyDescriptor,
  partyLabel,
  moneyLabel,
  showExpectedAt,
  submitLabel,
  onSubmit,
}: OrderFormProps<TParty>) {
  const formId = useId();
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrderForm,
    mode: 'onBlur',
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const lines = useFieldArray({ control, name: 'lines' });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(mapped ? 'Please fix the highlighted fields.' : errorMessage(error));
    }
  });

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <section className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
        <Field label={partyLabel} required error={errors.partyId?.message}>
          <Controller
            control={control}
            name="partyId"
            render={({ field }) => (
              <ResourceSelect
                descriptor={partyDescriptor}
                value={field.value}
                onChange={field.onChange}
                placeholder={`Select a ${partyLabel.toLowerCase()}`}
              />
            )}
          />
        </Field>
        <Field label="Warehouse" required error={errors.warehouseId?.message}>
          <Controller
            control={control}
            name="warehouseId"
            render={({ field }) => (
              <ResourceSelect<WarehouseResponse>
                descriptor={WAREHOUSES}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a warehouse"
              />
            )}
          />
        </Field>
        <Field label="Currency" description="ISO-4217" required error={errors.currency?.message}>
          <FieldControl>
            <Input maxLength={3} placeholder="USD" disabled={isSubmitting} {...register('currency')} />
          </FieldControl>
        </Field>
        {showExpectedAt ? (
          <Field label="Expected date" error={errors.expectedAt?.message}>
            <FieldControl>
              <Input type="date" disabled={isSubmitting} {...register('expectedAt')} />
            </FieldControl>
          </Field>
        ) : null}
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
            onClick={() => lines.append({ ...emptyOrderLine })}
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
              <Field
                label={moneyLabel}
                description="Major units"
                required
                error={errors.lines?.[index]?.unitMajor?.message}
                className="sm:w-32"
              >
                <FieldControl>
                  <Input inputMode="decimal" disabled={isSubmitting} {...register(`lines.${index}.unitMajor`)} />
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
