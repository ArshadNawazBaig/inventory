import { describe, expect, it } from 'vitest';
import {
  BILLING_PERMISSIONS,
  CATALOG_PERMISSIONS,
  InviteMemberRequestSchema,
  LoginRequestSchema,
  MEMBER_PERMISSIONS,
  PERMISSION_CATALOG,
  RegisterRequestSchema,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_IDS,
  permissionsForRoles,
} from '@stockflow/types';

describe('permission catalog', () => {
  it('has no duplicates and includes module + auth permissions', () => {
    expect(new Set(PERMISSION_CATALOG).size).toBe(PERMISSION_CATALOG.length);
    for (const p of [
      CATALOG_PERMISSIONS.create,
      BILLING_PERMISSIONS.manage,
      MEMBER_PERMISSIONS.invite,
      ROLE_PERMISSIONS.view,
    ]) {
      expect(PERMISSION_CATALOG).toContain(p);
    }
  });
});

describe('system roles', () => {
  it('defines exactly the seven role ids', () => {
    expect(SYSTEM_ROLES.map((r) => r.id)).toEqual([...SYSTEM_ROLE_IDS]);
    expect(SYSTEM_ROLE_IDS).toHaveLength(7);
  });

  it('Owner has the full catalog; Admin has all but billing ownership transfer', () => {
    const owner = SYSTEM_ROLES.find((r) => r.id === 'owner');
    const admin = SYSTEM_ROLES.find((r) => r.id === 'admin');
    expect(owner?.permissions).toHaveLength(PERMISSION_CATALOG.length);
    expect(admin?.permissions).toContain(BILLING_PERMISSIONS.view);
    expect(admin?.permissions).not.toContain(BILLING_PERMISSIONS.manage);
  });

  it('Viewer is read-only (only .view permissions, plus exports)', () => {
    const viewer = SYSTEM_ROLES.find((r) => r.id === 'viewer');
    const nonView = (viewer?.permissions ?? []).filter((p) => !p.endsWith('.view'));
    expect(nonView.every((p) => p.endsWith('.export'))).toBe(true);
    expect(viewer?.permissions).not.toContain(CATALOG_PERMISSIONS.create);
  });

  it('permissionsForRoles is the deduplicated union of the roles', () => {
    const union = permissionsForRoles(['warehouse_staff', 'viewer']);
    expect(new Set(union).size).toBe(union.length);
    expect(union).toContain('inventory.adjust');
    expect(union).toContain('report.view');
    expect(permissionsForRoles([])).toEqual([]);
  });
});

describe('auth request schemas', () => {
  it('RegisterRequestSchema enforces email + password policy + no unknown keys', () => {
    const ok = RegisterRequestSchema.safeParse({
      organizationName: 'Acme',
      name: 'Ada',
      email: 'ada@acme.test',
      password: 'sup3rsecret',
    });
    expect(ok.success).toBe(true);
    expect(RegisterRequestSchema.safeParse({ organizationName: 'Acme', name: 'Ada', email: 'nope', password: 'sup3rsecret' }).success).toBe(false);
    expect(RegisterRequestSchema.safeParse({ organizationName: 'Acme', name: 'Ada', email: 'ada@acme.test', password: 'short' }).success).toBe(false);
    expect(RegisterRequestSchema.safeParse({ organizationName: 'Acme', name: 'Ada', email: 'ada@acme.test', password: 'sup3rsecret', extra: 1 }).success).toBe(false);
  });

  it('InviteMemberRequestSchema requires at least one known role', () => {
    expect(InviteMemberRequestSchema.safeParse({ email: 'b@acme.test', roleIds: ['viewer'] }).success).toBe(true);
    expect(InviteMemberRequestSchema.safeParse({ email: 'b@acme.test', roleIds: [] }).success).toBe(false);
    expect(InviteMemberRequestSchema.safeParse({ email: 'b@acme.test', roleIds: ['wizard'] }).success).toBe(false);
  });

  it('LoginRequestSchema accepts any non-empty password (no policy disclosure)', () => {
    expect(LoginRequestSchema.safeParse({ email: 'a@acme.test', password: 'x' }).success).toBe(true);
    expect(LoginRequestSchema.safeParse({ email: 'a@acme.test', password: '' }).success).toBe(false);
  });
});
