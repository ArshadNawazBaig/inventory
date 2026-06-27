import { Field, FieldControl, Input } from '@stockflow/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { VariantFormValues } from '../lib/product-form.schema';

type VariantFieldKey = keyof VariantFormValues;

export interface VariantFieldsProps {
  /** Returns the RHF registration for a variant field — bound to the right path by the parent form. */
  register: (key: VariantFieldKey) => UseFormRegisterReturn;
  /** Returns the current error message for a variant field, if any. */
  errorFor: (key: VariantFieldKey) => string | undefined;
  disabled?: boolean;
}

/**
 * The presentational variant editor — one set of inputs (SKU, barcode, price, reorder thresholds, unit).
 * It is path-agnostic: the parent supplies `register`/`errorFor`, so the same layout serves the create
 * form's field array (`variants.0.sku`) and the standalone add/edit-variant dialog (`sku`). `Field` owns
 * all label/error/aria wiring (ids are auto-generated, so multiple instances never collide).
 */
export function VariantFields({ register, errorFor, disabled = false }: VariantFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="SKU"
        required
        description="Unique per product. Uppercased on save."
        error={errorFor('sku')}
        className="sm:col-span-2"
      >
        <FieldControl>
          <Input placeholder="TW-001" autoComplete="off" disabled={disabled} {...register('sku')} />
        </FieldControl>
      </Field>

      <Field label="Barcode" error={errorFor('barcode')}>
        <FieldControl>
          <Input placeholder="UPC / EAN" autoComplete="off" disabled={disabled} {...register('barcode')} />
        </FieldControl>
      </Field>

      <Field label="Unit id" description="24-char id (optional)" error={errorFor('unitId')}>
        <FieldControl>
          <Input placeholder="Defaults to base unit" autoComplete="off" disabled={disabled} {...register('unitId')} />
        </FieldControl>
      </Field>

      <Field label="Default price" description="Major units, e.g. 12.50" error={errorFor('price')}>
        <FieldControl>
          <Input inputMode="decimal" placeholder="0.00" disabled={disabled} {...register('price')} />
        </FieldControl>
      </Field>

      <Field label="Currency" error={errorFor('currency')}>
        <FieldControl>
          <Input placeholder="USD" maxLength={3} disabled={disabled} {...register('currency')} />
        </FieldControl>
      </Field>

      <Field label="Reorder point" error={errorFor('reorderPoint')}>
        <FieldControl>
          <Input inputMode="numeric" placeholder="0" disabled={disabled} {...register('reorderPoint')} />
        </FieldControl>
      </Field>

      <Field label="Reorder quantity" error={errorFor('reorderQty')}>
        <FieldControl>
          <Input inputMode="numeric" placeholder="0" disabled={disabled} {...register('reorderQty')} />
        </FieldControl>
      </Field>
    </div>
  );
}
