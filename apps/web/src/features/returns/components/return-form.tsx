'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Field,
  FieldControl,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
  toast,
} from '@stockflow/ui';
import { AddIcon, DeleteIcon } from '@stockflow/icons';
import type { CustomerResponse, SupplierResponse } from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { CUSTOMERS, SUPPLIERS } from '@/features/parties/descriptors';
import { ResourceSelect } from '@/features/resources/components/resource-select';
import { VariantPicker } from '@/features/inventory/components/variant-picker';
import { LocationPicker } from '@/features/inventory/components/location-picker';
import { useCreateReturn } from '../mutations';
import {
  emptyReturnForm,
  emptyReturnLine,
  returnFormSchema,
  toCreateReturn,
  type ReturnFormValues,
} from '../lib/forms';

/** Create-a-draft-return page body — kind picks the party list (customer vs supplier); a dynamic line editor. */
export function ReturnForm() {
  const router = useRouter();
  const create = useCreateReturn();
  const formId = useId();
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: emptyReturnForm,
    mode: 'onBlur',
  });
  const lines = useFieldArray({ control, name: 'lines' });
  const kind = watch('kind');

  const submit = handleSubmit(async (values) => {
    try {
      const ret = await create.mutateAsync(toCreateReturn(values));
      toast.success(`Created ${ret.returnNumber}`);
      router.push(`/returns/${ret.id}`);
    } catch (error) {
      const mapped = applyApiErrorToForm(error, setError);
      toast.error(mapped ? 'Please fix the highlighted fields.' : errorMessage(error));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New return</h1>
        <p className="text-sm text-muted-foreground">
          Bring stock back from a customer, or send it back to a supplier.
        </p>
      </header>

      <form id={formId} onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <section className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
          <Field label="Kind" required error={errors.kind?.message}>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(next) => {
                    field.onChange(next);
                    setValue('partyId', ''); // reset the party when the kind flips
                  }}
                  disabled={isSubmitting}
                >
                  <FieldControl>
                    <SelectTrigger placeholder="Select a kind" />
                  </FieldControl>
                  <SelectContent>
                    <SelectItem value="customer">Customer return (stock in)</SelectItem>
                    <SelectItem value="supplier">Supplier return (stock out)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label={kind === 'supplier' ? 'Supplier' : 'Customer'}
            required
            error={errors.partyId?.message}
          >
            <Controller
              control={control}
              name="partyId"
              render={({ field }) =>
                kind === 'supplier' ? (
                  <ResourceSelect<SupplierResponse>
                    descriptor={SUPPLIERS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a supplier"
                  />
                ) : (
                  <ResourceSelect<CustomerResponse>
                    descriptor={CUSTOMERS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a customer"
                  />
                )
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="locationId"
              render={({ field }) => (
                <LocationPicker
                  label="Location"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.locationId?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>
          <Field label="Reason" error={errors.reason?.message}>
            <FieldControl>
              <Input disabled={isSubmitting} placeholder="e.g. Damaged on arrival" {...register('reason')} />
            </FieldControl>
          </Field>
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
              onClick={() => lines.append({ ...emptyReturnLine })}
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
            Create return
          </Button>
        </div>
      </form>
    </div>
  );
}
