import { Field, FieldControl, Input, Textarea } from '@stockflow/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { ProductDetailsValues } from '../lib/product-form.schema';

type DetailsKey = keyof ProductDetailsValues;

export interface ProductDetailsFieldsProps {
  register: (key: DetailsKey) => UseFormRegisterReturn;
  errorFor: (key: DetailsKey) => string | undefined;
  disabled?: boolean;
}

/**
 * The product's own fields (name, description, and the catalog references). Category / brand / unit are
 * raw 24-char ids for now — the lookup pickers arrive with the Category/Brand/Unit sub-modules, at which
 * point these inputs become Selects without touching the form contract.
 */
export function ProductDetailsFields({ register, errorFor, disabled = false }: ProductDetailsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" required error={errorFor('name')} className="sm:col-span-2">
        <FieldControl>
          <Input placeholder="Wireless mouse" autoComplete="off" disabled={disabled} {...register('name')} />
        </FieldControl>
      </Field>

      <Field
        label="Description"
        description="Optional. Up to 5,000 characters."
        error={errorFor('description')}
        className="sm:col-span-2"
      >
        <FieldControl>
          <Textarea
            placeholder="What is this product?"
            rows={4}
            disabled={disabled}
            {...register('description')}
          />
        </FieldControl>
      </Field>

      <Field
        label="Base unit id"
        required
        description="24-char unit id (temporary until unit picker)"
        error={errorFor('baseUnitId')}
        className="sm:col-span-2"
      >
        <FieldControl>
          <Input placeholder="aaaaaaaaaaaaaaaaaaaaaaaa" autoComplete="off" disabled={disabled} {...register('baseUnitId')} />
        </FieldControl>
      </Field>

      <Field label="Category id" description="Optional 24-char id" error={errorFor('categoryId')}>
        <FieldControl>
          <Input placeholder="Optional" autoComplete="off" disabled={disabled} {...register('categoryId')} />
        </FieldControl>
      </Field>

      <Field label="Brand id" description="Optional 24-char id" error={errorFor('brandId')}>
        <FieldControl>
          <Input placeholder="Optional" autoComplete="off" disabled={disabled} {...register('brandId')} />
        </FieldControl>
      </Field>
    </div>
  );
}
