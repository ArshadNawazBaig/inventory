import type { AddressInput } from '@stockflow/types';

/**
 * Embedded postal address — every sub-field nullable. Shared by any entity that carries an address
 * (parties, warehouses, …). Framework-free; the response contract (`AddressSchema`) mirrors this shape,
 * so domain → response is a pass-through.
 */
export interface Address {
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
}

/**
 * Normalise an address input → domain {@link Address}; returns null when absent or entirely empty (so an
 * all-blank address is stored as `null`, not a husk). Country is upper-cased to its ISO-3166 alpha-2 form.
 */
export function buildAddress(input: AddressInput | null | undefined): Address | null {
  if (!input) return null;
  const address: Address = {
    line1: input.line1 ?? null,
    line2: input.line2 ?? null,
    city: input.city ?? null,
    region: input.region ?? null,
    postalCode: input.postalCode ?? null,
    country: input.country ? input.country.toUpperCase() : null,
  };
  return Object.values(address).some((value) => value !== null) ? address : null;
}
