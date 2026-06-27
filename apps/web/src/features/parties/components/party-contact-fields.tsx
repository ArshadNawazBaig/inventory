import { Field, FieldControl, Input } from '@stockflow/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';

type ContactKey = 'code' | 'email' | 'phone' | 'website' | 'taxId';

export interface PartyContactFieldsProps {
  register: (key: ContactKey) => UseFormRegisterReturn;
  errorFor: (key: ContactKey) => string | undefined;
  disabled?: boolean;
}

/** The contact fields shared by suppliers and customers. */
export function PartyContactFields({ register, errorFor, disabled = false }: PartyContactFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Code" description="Optional unique key, e.g. ACME" error={errorFor('code')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('code')} />
        </FieldControl>
      </Field>
      <Field label="Email" error={errorFor('email')}>
        <FieldControl>
          <Input inputMode="email" autoComplete="off" disabled={disabled} {...register('email')} />
        </FieldControl>
      </Field>
      <Field label="Phone" error={errorFor('phone')}>
        <FieldControl>
          <Input inputMode="tel" autoComplete="off" disabled={disabled} {...register('phone')} />
        </FieldControl>
      </Field>
      <Field label="Website" error={errorFor('website')}>
        <FieldControl>
          <Input inputMode="url" placeholder="https://…" disabled={disabled} {...register('website')} />
        </FieldControl>
      </Field>
      <Field label="Tax id" error={errorFor('taxId')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('taxId')} />
        </FieldControl>
      </Field>
    </div>
  );
}
