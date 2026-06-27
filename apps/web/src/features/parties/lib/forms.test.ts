import { describe, it, expect } from 'vitest';
import type { CustomerResponse, SupplierResponse } from '@stockflow/types';
import {
  customerFormSchema,
  customerToForm,
  emptyCustomerForm,
  emptySupplierForm,
  supplierFormSchema,
  supplierToForm,
  toCreateCustomer,
  toCreateSupplier,
  toUpdateCustomer,
  toUpdateSupplier,
} from './forms';

describe('supplierFormSchema', () => {
  it('accepts a minimal supplier (name only)', () => {
    expect(supplierFormSchema.safeParse(emptySupplierForm).success).toBe(false); // empty name
    expect(supplierFormSchema.safeParse({ ...emptySupplierForm, name: 'Acme' }).success).toBe(true);
  });

  it('validates email, website, currency and lead time', () => {
    const base = { ...emptySupplierForm, name: 'Acme' };
    expect(supplierFormSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false);
    expect(supplierFormSchema.safeParse({ ...base, website: 'nope' }).success).toBe(false);
    expect(supplierFormSchema.safeParse({ ...base, currency: 'US' }).success).toBe(false);
    expect(supplierFormSchema.safeParse({ ...base, leadTimeDays: 'soon' }).success).toBe(false);
    expect(supplierFormSchema.safeParse({ ...base, currency: 'usd', leadTimeDays: '7' }).success).toBe(true);
  });
});

describe('toCreateSupplier', () => {
  it('trims, omits blanks, builds address, upper-cases currency/country', () => {
    const request = toCreateSupplier({
      ...emptySupplierForm,
      name: '  Acme  ',
      code: 'acme-1',
      currency: 'usd',
      leadTimeDays: '7',
      address: { ...emptySupplierForm.address, city: 'Springfield', country: 'us' },
    });
    expect(request.name).toBe('Acme');
    expect(request.code).toBe('acme-1');
    expect(request.currency).toBe('USD');
    expect(request.leadTimeDays).toBe(7);
    expect(request.address).toEqual({ city: 'Springfield', country: 'US' });
    expect(request.email).toBeUndefined();
  });

  it('omits an entirely-empty address', () => {
    const request = toCreateSupplier({ ...emptySupplierForm, name: 'Acme' });
    expect(request.address).toBeUndefined();
  });
});

describe('toUpdateSupplier', () => {
  it('nulls blank optionals and a blank address', () => {
    const request = toUpdateSupplier({ ...emptySupplierForm, name: 'Acme' });
    expect(request.code).toBeNull();
    expect(request.currency).toBeNull();
    expect(request.address).toBeNull();
    expect(request.leadTimeDays).toBeNull();
  });
});

describe('supplierToForm', () => {
  it('maps null fields to empty strings and address to form', () => {
    const supplier: SupplierResponse = {
      id: '1',
      name: 'Acme',
      code: 'ACME',
      email: null,
      phone: null,
      website: null,
      taxId: null,
      notes: null,
      address: { line1: '1 Main', line2: null, city: 'Town', region: null, postalCode: null, country: 'US' },
      status: 'active',
      currency: 'USD',
      paymentTerms: null,
      leadTimeDays: 5,
      createdAt: '',
      updatedAt: '',
    };
    const values = supplierToForm(supplier);
    expect(values.code).toBe('ACME');
    expect(values.email).toBe('');
    expect(values.address.city).toBe('Town');
    expect(values.leadTimeDays).toBe('5');
  });
});

describe('customer mappers', () => {
  it('requires a valid customer type', () => {
    expect(customerFormSchema.safeParse({ ...emptyCustomerForm, name: 'Jane', customerType: 'vip' }).success).toBe(
      false,
    );
    expect(customerFormSchema.safeParse({ ...emptyCustomerForm, name: 'Jane' }).success).toBe(true);
  });

  it('converts the credit limit to minor units', () => {
    const request = toCreateCustomer({
      ...emptyCustomerForm,
      name: 'Jane',
      customerType: 'individual',
      creditLimit: '1000.50',
      currency: 'usd',
    });
    expect(request.customerType).toBe('individual');
    expect(request.creditLimitMinor).toBe(100050);
    expect(request.currency).toBe('USD');
  });

  it('nulls a blank credit limit on update', () => {
    const request = toUpdateCustomer({ ...emptyCustomerForm, name: 'Jane' });
    expect(request.creditLimitMinor).toBeNull();
    expect(request.customerType).toBe('business');
  });

  it('round-trips a response to form values', () => {
    const customer: CustomerResponse = {
      id: '1',
      name: 'Jane',
      code: null,
      email: null,
      phone: null,
      website: null,
      taxId: null,
      notes: null,
      address: null,
      status: 'active',
      customerType: 'individual',
      creditLimitMinor: 100050,
      currency: 'USD',
      createdAt: '',
      updatedAt: '',
    };
    expect(customerToForm(customer).creditLimit).toBe('1000.50');
  });
});
