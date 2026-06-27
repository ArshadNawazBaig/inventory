import { z } from 'zod';
import type { Address, AddressInput } from '@stockflow/types';

/**
 * Shared form-shaped schema + mappers for an embedded postal address (parties, warehouses, …). As
 * elsewhere, the wire contract lives in `@stockflow/types`; this models human input (all-string fields,
 * blank = unset) and translates to/from the request and response shapes. The API re-validates authoritatively.
 */

const trimmedString = (max: number) => z.string().trim().max(max);

function trimmed(value: string): string {
  return value.trim();
}

export const addressFormSchema = z.object({
  line1: trimmedString(200),
  line2: trimmedString(200),
  city: trimmedString(120),
  region: trimmedString(120),
  postalCode: trimmedString(32),
  country: z.string().trim().refine((v) => v === '' || /^[A-Za-z]{2}$/.test(v), '2-letter country code'),
});
export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const emptyAddressForm: AddressFormValues = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
};

/** Address form → request input (omit entirely when blank; country upper-cased). */
export function addressToInput(address: AddressFormValues): AddressInput | undefined {
  const input: AddressInput = {};
  if (trimmed(address.line1)) input.line1 = trimmed(address.line1);
  if (trimmed(address.line2)) input.line2 = trimmed(address.line2);
  if (trimmed(address.city)) input.city = trimmed(address.city);
  if (trimmed(address.region)) input.region = trimmed(address.region);
  if (trimmed(address.postalCode)) input.postalCode = trimmed(address.postalCode);
  if (trimmed(address.country)) input.country = trimmed(address.country).toUpperCase();
  return Object.keys(input).length > 0 ? input : undefined;
}

/** Response address (or null) → address form values (nulls → blank). */
export function addressToForm(address: Address | null): AddressFormValues {
  if (!address) return { ...emptyAddressForm };
  return {
    line1: address.line1 ?? '',
    line2: address.line2 ?? '',
    city: address.city ?? '',
    region: address.region ?? '',
    postalCode: address.postalCode ?? '',
    country: address.country ?? '',
  };
}
