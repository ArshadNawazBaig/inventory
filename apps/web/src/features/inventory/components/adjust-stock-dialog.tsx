'use client';

import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, FieldControl, Input, Modal, Textarea, toast } from '@stockflow/ui';
import { errorMessage } from '@/lib/api';
import { applyApiErrorToForm } from '@/lib/forms';
import { useCreateAdjustment } from '../mutations';
import {
  adjustmentFormSchema,
  emptyAdjustmentForm,
  toCreateAdjustment,
  type AdjustmentFormValues,
} from '../lib/forms';
import { VariantPicker } from './variant-picker';
import { LocationPicker } from './location-picker';

export interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Post a manual stock adjustment — choose a variant + location, a signed delta, and (for inbound deltas)
 * an optional unit cost that drives weighted-average valuation. Every adjustment is one immutable ledger
 * entry; the projection updates atomically server-side.
 */
export function AdjustStockDialog({ open, onOpenChange }: AdjustStockDialogProps) {
  const formId = useId();
  const create = useCreateAdjustment();

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: emptyAdjustmentForm,
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
    if (open) reset(emptyAdjustmentForm);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync(toCreateAdjustment(values));
      toast.success(`Stock updated — on hand ${result.level.onHand}`);
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
      title="Adjust stock"
      description="Post a manual adjustment. This writes one immutable ledger entry."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isSubmitting} loadingText="Posting…">
            Post adjustment
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
        <Controller
          control={control}
          name="variantId"
          render={({ field }) => (
            <VariantPicker
              value={field.value}
              onChange={field.onChange}
              error={errors.variantId?.message}
              disabled={isSubmitting}
            />
          )}
        />

        <Controller
          control={control}
          name="locationId"
          render={({ field }) => (
            <LocationPicker
              value={field.value}
              onChange={field.onChange}
              error={errors.locationId?.message}
              disabled={isSubmitting}
            />
          )}
        />

        <Field
          label="Quantity change"
          description="Signed whole number — positive to add, negative to remove (e.g. 10 or -5)."
          required
          error={errors.delta?.message}
        >
          <FieldControl>
            <Input inputMode="numeric" placeholder="10" disabled={isSubmitting} {...register('delta')} />
          </FieldControl>
        </Field>

        <Field label="Note" error={errors.note?.message}>
          <FieldControl>
            <Textarea rows={2} placeholder="Reason for the adjustment" disabled={isSubmitting} {...register('note')} />
          </FieldControl>
        </Field>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground">Inbound cost (optional)</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            For positive adjustments — updates the weighted-average cost.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Unit cost" description="Major units, e.g. 12.50" error={errors.unitCost?.message}>
              <FieldControl>
                <Input inputMode="decimal" placeholder="0.00" disabled={isSubmitting} {...register('unitCost')} />
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
