import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { Field, FieldControl, Input, Textarea } from '@stockflow/ui';
import { BRANDS, CATEGORIES, UNITS } from '@/features/lookups/descriptors';
import { ResourceSelect } from '@/features/resources/components/resource-select';

type TextKey = 'name' | 'description';
type RefKey = 'baseUnitId' | 'categoryId' | 'brandId';

export interface ProductDetailsFieldsProps<T extends FieldValues> {
  control: Control<T>;
  register: (key: TextKey) => UseFormRegisterReturn;
  errorFor: (key: TextKey | RefKey) => string | undefined;
  disabled?: boolean;
}

/** Coerce a generic RHF field value to a string for the controlled Select. */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * The product's own fields. Name/description are plain inputs; the catalog references (base unit,
 * category, brand) are real pickers backed by the Catalog Lookups module — bound with `Controller`
 * because a Select is not a native input. Optional references include a "None" option.
 */
export function ProductDetailsFields<T extends FieldValues>({
  control,
  register,
  errorFor,
  disabled = false,
}: ProductDetailsFieldsProps<T>) {
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
          <Textarea placeholder="What is this product?" rows={4} disabled={disabled} {...register('description')} />
        </FieldControl>
      </Field>

      <Field
        label="Base unit"
        required
        description="The product's unit of measure."
        error={errorFor('baseUnitId')}
        className="sm:col-span-2"
      >
        <Controller
          control={control}
          name={'baseUnitId' as Path<T>}
          render={({ field }) => (
            <ResourceSelect
              descriptor={UNITS}
              value={asString(field.value)}
              onChange={field.onChange}
              placeholder="Select a unit"
            />
          )}
        />
      </Field>

      <Field label="Category" description="Optional." error={errorFor('categoryId')}>
        <Controller
          control={control}
          name={'categoryId' as Path<T>}
          render={({ field }) => (
            <ResourceSelect
              descriptor={CATEGORIES}
              value={asString(field.value)}
              onChange={field.onChange}
              includeNone
              placeholder="No category"
            />
          )}
        />
      </Field>

      <Field label="Brand" description="Optional." error={errorFor('brandId')}>
        <Controller
          control={control}
          name={'brandId' as Path<T>}
          render={({ field }) => (
            <ResourceSelect
              descriptor={BRANDS}
              value={asString(field.value)}
              onChange={field.onChange}
              includeNone
              placeholder="No brand"
            />
          )}
        />
      </Field>
    </div>
  );
}
