import { Field, FieldControl, Input, Textarea } from '@stockflow/ui';
import type { UseFormRegisterReturn } from 'react-hook-form';

type BaseKey = 'name' | 'description';

export interface LookupBaseFieldsProps {
  register: (key: BaseKey) => UseFormRegisterReturn;
  errorFor: (key: BaseKey) => string | undefined;
  disabled?: boolean;
}

/** The name + description fields shared by every lookup form. */
export function LookupBaseFields({ register, errorFor, disabled = false }: LookupBaseFieldsProps) {
  return (
    <>
      <Field label="Name" required error={errorFor('name')}>
        <FieldControl>
          <Input autoComplete="off" disabled={disabled} {...register('name')} />
        </FieldControl>
      </Field>
      <Field label="Description" description="Optional." error={errorFor('description')}>
        <FieldControl>
          <Textarea rows={3} disabled={disabled} {...register('description')} />
        </FieldControl>
      </Field>
    </>
  );
}
