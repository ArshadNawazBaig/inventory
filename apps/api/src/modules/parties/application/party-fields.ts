import type { AddressInput } from '@stockflow/types';
import { buildAddress } from '../../../common/address';

/** The shared party contact fields accepted on create (each optional). */
export interface PartyCreateBase {
  code?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  website?: string | undefined;
  taxId?: string | undefined;
  notes?: string | undefined;
  address?: AddressInput | undefined;
}

/** Build the shared party fields for a new entity (blanks → null). */
export function partyCreateFields(input: PartyCreateBase) {
  return {
    code: input.code ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    taxId: input.taxId ?? null,
    notes: input.notes ?? null,
    address: buildAddress(input.address),
  };
}

/** The shared party contact fields accepted on update (nullable to clear). */
export interface PartyUpdateBase {
  code?: string | null | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  website?: string | null | undefined;
  taxId?: string | null | undefined;
  notes?: string | null | undefined;
  address?: AddressInput | null | undefined;
}

/** Apply the shared party fields onto a patch object (only fields the caller provided). */
export function applyPartyUpdate(patch: Record<string, unknown>, input: PartyUpdateBase): void {
  if (input.code !== undefined) patch.code = input.code;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.website !== undefined) patch.website = input.website;
  if (input.taxId !== undefined) patch.taxId = input.taxId;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.address !== undefined) patch.address = input.address ? buildAddress(input.address) : null;
}
