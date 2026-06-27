import { Field, FieldControl, Input } from '@stockflow/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';

type AddressKey = 'line1' | 'line2' | 'city' | 'region' | 'postalCode' | 'country';

export interface AddressFieldsProps {
  register: (key: AddressKey) => UseFormRegisterReturn;
  errorFor: (key: AddressKey) => string | undefined;
  disabled?: boolean;
}

/** The embedded postal-address fields, shared by suppliers and customers (all optional). */
export function AddressFields({ register, errorFor, disabled = false }: AddressFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Address line 1" error={errorFor('line1')} className="sm:col-span-2">
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('line1')} />
        </FieldControl>
      </Field>
      <Field label="Address line 2" error={errorFor('line2')} className="sm:col-span-2">
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('line2')} />
        </FieldControl>
      </Field>
      <Field label="City" error={errorFor('city')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('city')} />
        </FieldControl>
      </Field>
      <Field label="Region / State" error={errorFor('region')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('region')} />
        </FieldControl>
      </Field>
      <Field label="Postal code" error={errorFor('postalCode')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('postalCode')} />
        </FieldControl>
      </Field>
      <Field label="Country" description="2-letter code, e.g. US" error={errorFor('country')}>
        <FieldControl>
          <Input maxLength={2} autoComplete="off" disabled={disabled} {...register('country')} />
        </FieldControl>
      </Field>
    </div>
  );
}
