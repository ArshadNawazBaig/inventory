import { z } from 'zod';
import type {
  Address,
  AddressInput,
  CreateCustomerRequest,
  CreateSupplierRequest,
  CustomerResponse,
  SupplierResponse,
  UpdateCustomerRequest,
  UpdateSupplierRequest,
} from '@stockflow/types';
import { formatMinorToMajor, parseMajorToMinor } from '@/lib/money';

/**
 * Form-shaped schemas + request mappers for the party modules. As elsewhere, the wire contract lives in
 * `@stockflow/types`; these model human input (all-string fields, blank = unset) and translate to the
 * request shape. The API re-validates authoritatively.
 */

const trimmedString = (max: number) => z.string().trim().max(max);
const optionalCode = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(v), 'Letters, numbers, hyphen and underscore');
const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Enter a valid email');
const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/.+/.test(v), 'Must be a valid URL (http/https)');
const optionalCurrency = z
  .string()
  .trim()
  .refine((v) => v === '' || /^[A-Za-z]{3}$/.test(v), 'ISO-4217 code, e.g. USD');
const optionalCount = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+$/.test(v), 'Whole number ≥ 0');
const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount (e.g. 1000.00)');

export const addressFormSchema = z.object({
  line1: trimmedString(200),
  line2: trimmedString(200),
  city: trimmedString(120),
  region: trimmedString(120),
  postalCode: trimmedString(32),
  country: z.string().trim().refine((v) => v === '' || /^[A-Za-z]{2}$/.test(v), '2-letter country code'),
});
export type AddressFormValues = z.infer<typeof addressFormSchema>;
const emptyAddressForm: AddressFormValues = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
};

const partyShape = {
  name: z.string().trim().min(1, 'Name is required').max(160, 'Name is too long'),
  code: optionalCode,
  email: optionalEmail,
  phone: trimmedString(40),
  website: optionalUrl,
  taxId: trimmedString(60),
  notes: trimmedString(2000),
  address: addressFormSchema,
};

function trimmed(value: string): string {
  return value.trim();
}

/** Address form → request input (omit entirely when blank). */
function addressToInput(address: AddressFormValues): AddressInput | undefined {
  const input: AddressInput = {};
  if (trimmed(address.line1)) input.line1 = trimmed(address.line1);
  if (trimmed(address.line2)) input.line2 = trimmed(address.line2);
  if (trimmed(address.city)) input.city = trimmed(address.city);
  if (trimmed(address.region)) input.region = trimmed(address.region);
  if (trimmed(address.postalCode)) input.postalCode = trimmed(address.postalCode);
  if (trimmed(address.country)) input.country = trimmed(address.country).toUpperCase();
  return Object.keys(input).length > 0 ? input : undefined;
}

function addressToForm(address: Address | null): AddressFormValues {
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

/** Apply the shared party contact fields onto a create request (blank = unset). */
function applyContactCreate(
  request: {
    code?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    taxId?: string | undefined;
    notes?: string | undefined;
    address?: AddressInput | undefined;
  },
  values: { code: string; email: string; phone: string; website: string; taxId: string; notes: string; address: AddressFormValues },
): void {
  if (trimmed(values.code)) request.code = trimmed(values.code);
  if (trimmed(values.email)) request.email = trimmed(values.email);
  if (trimmed(values.phone)) request.phone = trimmed(values.phone);
  if (trimmed(values.website)) request.website = trimmed(values.website);
  if (trimmed(values.taxId)) request.taxId = trimmed(values.taxId);
  if (trimmed(values.notes)) request.notes = trimmed(values.notes);
  const address = addressToInput(values.address);
  if (address) request.address = address;
}

/** The shared party contact fields on an update request (blank → null to clear). */
function contactUpdate(values: {
  code: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  notes: string;
  address: AddressFormValues;
}) {
  return {
    code: trimmed(values.code) ? trimmed(values.code) : null,
    email: trimmed(values.email) ? trimmed(values.email) : null,
    phone: trimmed(values.phone) ? trimmed(values.phone) : null,
    website: trimmed(values.website) ? trimmed(values.website) : null,
    taxId: trimmed(values.taxId) ? trimmed(values.taxId) : null,
    notes: trimmed(values.notes) ? trimmed(values.notes) : null,
    address: addressToInput(values.address) ?? null,
  };
}

// ─── Supplier ──────────────────────────────────────────────────────────────────
export const supplierFormSchema = z.object({
  ...partyShape,
  currency: optionalCurrency,
  paymentTerms: trimmedString(60),
  leadTimeDays: optionalCount,
});
export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
export const emptySupplierForm: SupplierFormValues = {
  name: '',
  code: '',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  notes: '',
  address: { ...emptyAddressForm },
  currency: '',
  paymentTerms: '',
  leadTimeDays: '',
};

export function supplierToForm(supplier: SupplierResponse): SupplierFormValues {
  return {
    name: supplier.name,
    code: supplier.code ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    website: supplier.website ?? '',
    taxId: supplier.taxId ?? '',
    notes: supplier.notes ?? '',
    address: addressToForm(supplier.address),
    currency: supplier.currency ?? '',
    paymentTerms: supplier.paymentTerms ?? '',
    leadTimeDays: supplier.leadTimeDays != null ? String(supplier.leadTimeDays) : '',
  };
}

export function toCreateSupplier(values: SupplierFormValues): CreateSupplierRequest {
  const request: CreateSupplierRequest = { name: trimmed(values.name) };
  applyContactCreate(request, values);
  if (trimmed(values.currency)) request.currency = trimmed(values.currency).toUpperCase();
  if (trimmed(values.paymentTerms)) request.paymentTerms = trimmed(values.paymentTerms);
  if (trimmed(values.leadTimeDays)) request.leadTimeDays = Number(values.leadTimeDays);
  return request;
}

export function toUpdateSupplier(values: SupplierFormValues): UpdateSupplierRequest {
  return {
    name: trimmed(values.name),
    ...contactUpdate(values),
    currency: trimmed(values.currency) ? trimmed(values.currency).toUpperCase() : null,
    paymentTerms: trimmed(values.paymentTerms) ? trimmed(values.paymentTerms) : null,
    leadTimeDays: trimmed(values.leadTimeDays) ? Number(values.leadTimeDays) : null,
  };
}

// ─── Customer ────────────────────────────────────────────────────────────────
export const customerFormSchema = z.object({
  ...partyShape,
  customerType: z.enum(['individual', 'business']),
  creditLimit: optionalMoney,
  currency: optionalCurrency,
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export const emptyCustomerForm: CustomerFormValues = {
  name: '',
  code: '',
  email: '',
  phone: '',
  website: '',
  taxId: '',
  notes: '',
  address: { ...emptyAddressForm },
  customerType: 'business',
  creditLimit: '',
  currency: '',
};

export function customerToForm(customer: CustomerResponse): CustomerFormValues {
  return {
    name: customer.name,
    code: customer.code ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    website: customer.website ?? '',
    taxId: customer.taxId ?? '',
    notes: customer.notes ?? '',
    address: addressToForm(customer.address),
    customerType: customer.customerType,
    creditLimit: customer.creditLimitMinor != null ? formatMinorToMajor(customer.creditLimitMinor) : '',
    currency: customer.currency ?? '',
  };
}

export function toCreateCustomer(values: CustomerFormValues): CreateCustomerRequest {
  const request: CreateCustomerRequest = { name: trimmed(values.name), customerType: values.customerType };
  applyContactCreate(request, values);
  const credit = trimmed(values.creditLimit) ? parseMajorToMinor(values.creditLimit) : null;
  if (credit !== null) request.creditLimitMinor = credit;
  if (trimmed(values.currency)) request.currency = trimmed(values.currency).toUpperCase();
  return request;
}

export function toUpdateCustomer(values: CustomerFormValues): UpdateCustomerRequest {
  const credit = trimmed(values.creditLimit) ? parseMajorToMinor(values.creditLimit) : null;
  return {
    name: trimmed(values.name),
    ...contactUpdate(values),
    customerType: values.customerType,
    creditLimitMinor: credit,
    currency: trimmed(values.currency) ? trimmed(values.currency).toUpperCase() : null,
  };
}
