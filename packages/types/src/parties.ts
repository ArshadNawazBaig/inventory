import { z } from 'zod';
import { PageMetaSchema } from './catalog';
import { LOOKUP_STATUS } from './catalog-lookups';

/**
 * Party contracts (Suppliers · Customers) — the external business parties the operational modules
 * transact with. Single source of truth for validation AND types, shared by API + worker + web.
 * See docs/modules/parties.md.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const SUPPLIER_PERMISSIONS = { view: 'supplier.view', manage: 'supplier.manage' } as const;
export const CUSTOMER_PERMISSIONS = { view: 'customer.view', manage: 'customer.manage' } as const;
export type PartyPermission =
  | (typeof SUPPLIER_PERMISSIONS)[keyof typeof SUPPLIER_PERMISSIONS]
  | (typeof CUSTOMER_PERMISSIONS)[keyof typeof CUSTOMER_PERMISSIONS];

export const CUSTOMER_TYPES = ['individual', 'business'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const nameField = z.string().trim().min(1, 'Name is required').max(160);
const codeField = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Letters, numbers, hyphen and underscore only');
const emailField = z.string().trim().max(200).email('Must be a valid email');
const phoneField = z.string().trim().min(1).max(40);
const websiteField = z.string().trim().url('Must be a valid URL').max(2000);
const taxIdField = z.string().trim().min(1).max(60);
const notesField = z.string().trim().max(2000);
const currencyField = z.string().regex(/^[A-Z]{3}$/, 'ISO-4217 currency code');
const moneyMinor = z.number().int().min(0);
const leadTimeField = z.number().int().min(0).max(3650);

// ─── Address ───────────────────────────────────────────────────────────────────
/** Address as accepted on input — every sub-field optional. */
export const AddressInputSchema = z
  .object({
    line1: z.string().trim().max(200).optional(),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(120).optional(),
    region: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(32).optional(),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, 'ISO-3166 alpha-2 code').optional(),
  })
  .strict();
export type AddressInput = z.infer<typeof AddressInputSchema>;

/** Address as returned — every sub-field nullable. */
export const AddressSchema = z.object({
  line1: z.string().nullable(),
  line2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
});
export type Address = z.infer<typeof AddressSchema>;

// Shared response envelope fields for a party.
const partyResponseBase = {
  id: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  taxId: z.string().nullable(),
  notes: z.string().nullable(),
  address: AddressSchema.nullable(),
  status: z.enum(LOOKUP_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
};

// ─── Supplier ──────────────────────────────────────────────────────────────────
export const CreateSupplierRequestSchema = z
  .object({
    name: nameField,
    code: codeField.optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
    website: websiteField.optional(),
    taxId: taxIdField.optional(),
    notes: notesField.optional(),
    address: AddressInputSchema.optional(),
    currency: currencyField.optional(),
    paymentTerms: z.string().trim().max(60).optional(),
    leadTimeDays: leadTimeField.optional(),
  })
  .strict();
export type CreateSupplierRequest = z.infer<typeof CreateSupplierRequestSchema>;

export const UpdateSupplierRequestSchema = z
  .object({
    name: nameField,
    code: codeField.nullable(),
    email: emailField.nullable(),
    phone: phoneField.nullable(),
    website: websiteField.nullable(),
    taxId: taxIdField.nullable(),
    notes: notesField.nullable(),
    address: AddressInputSchema.nullable(),
    currency: currencyField.nullable(),
    paymentTerms: z.string().trim().max(60).nullable(),
    leadTimeDays: leadTimeField.nullable(),
  })
  .partial()
  .strict();
export type UpdateSupplierRequest = z.infer<typeof UpdateSupplierRequestSchema>;

export const SupplierResponseSchema = z.object({
  ...partyResponseBase,
  currency: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  leadTimeDays: z.number().int().nullable(),
});
export type SupplierResponse = z.infer<typeof SupplierResponseSchema>;

export const SupplierListResponseSchema = z.object({
  data: z.array(SupplierResponseSchema),
  meta: PageMetaSchema,
});
export type SupplierListResponse = z.infer<typeof SupplierListResponseSchema>;

// ─── Customer ────────────────────────────────────────────────────────────────
export const CreateCustomerRequestSchema = z
  .object({
    name: nameField,
    code: codeField.optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
    website: websiteField.optional(),
    taxId: taxIdField.optional(),
    notes: notesField.optional(),
    address: AddressInputSchema.optional(),
    customerType: z.enum(CUSTOMER_TYPES).default('business'),
    creditLimitMinor: moneyMinor.optional(),
    currency: currencyField.optional(),
  })
  .strict();
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;

export const UpdateCustomerRequestSchema = z
  .object({
    name: nameField,
    code: codeField.nullable(),
    email: emailField.nullable(),
    phone: phoneField.nullable(),
    website: websiteField.nullable(),
    taxId: taxIdField.nullable(),
    notes: notesField.nullable(),
    address: AddressInputSchema.nullable(),
    customerType: z.enum(CUSTOMER_TYPES),
    creditLimitMinor: moneyMinor.nullable(),
    currency: currencyField.nullable(),
  })
  .partial()
  .strict();
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;

export const CustomerResponseSchema = z.object({
  ...partyResponseBase,
  customerType: z.enum(CUSTOMER_TYPES),
  creditLimitMinor: z.number().int().nullable(),
  currency: z.string().nullable(),
});
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;

export const CustomerListResponseSchema = z.object({
  data: z.array(CustomerResponseSchema),
  meta: PageMetaSchema,
});
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
