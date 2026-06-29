import { z } from 'zod';
import { CATALOG_PERMISSIONS } from './catalog';
import { CATEGORY_PERMISSIONS, BRAND_PERMISSIONS, UNIT_PERMISSIONS } from './catalog-lookups';
import { SUPPLIER_PERMISSIONS, CUSTOMER_PERMISSIONS } from './parties';
import { WAREHOUSE_PERMISSIONS, LOCATION_PERMISSIONS } from './locations';
import { INVENTORY_PERMISSIONS } from './inventory';
import { PURCHASE_ORDER_PERMISSIONS } from './purchasing';
import { SALES_ORDER_PERMISSIONS } from './sales';
import { TRANSFER_PERMISSIONS } from './transfers';
import { RETURN_PERMISSIONS } from './returns';
import { REPORT_PERMISSIONS } from './reports';
import { DASHBOARD_PERMISSIONS } from './dashboard';
import { AUDIT_PERMISSIONS } from './audit';
import { NOTIFICATION_PERMISSIONS } from './notifications';
import { SETTINGS_PERMISSIONS } from './settings';
import { BILLING_PERMISSIONS } from './billing';
import { POS_PERMISSIONS } from './pos';

/**
 * Auth contracts — the single source of truth (validation AND types) for identity, sessions and RBAC, shared by
 * API + worker + web. See .claude/security/{authentication,authorization,permissions,rbac}.md and
 * docs/modules/auth.md.
 *
 * Model (rbac.md): a **permission** is an atomic capability (`<resource>.<action>`); a **role** is a named
 * bundle of permissions; a **membership** links a user to an organization with one or more roles. Access is
 * **deny-by-default** — effective permissions are the union of the actor's roles, enforced server-side.
 */

// ─── Auth-module-owned permissions (the other modules own theirs) ─────────────────
/** Member (a user's membership in an org) management. */
export const MEMBER_PERMISSIONS = {
  view: 'member.view',
  invite: 'member.invite',
  update: 'member.update',
  remove: 'member.remove',
} as const;
export type MemberPermission = (typeof MEMBER_PERMISSIONS)[keyof typeof MEMBER_PERMISSIONS];

/** Role catalog (`view` lists roles; `manage` is reserved for custom roles — a documented follow-up). */
export const ROLE_PERMISSIONS = { view: 'role.view', manage: 'role.manage' } as const;
export type RolePermission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS];

// ─── The atomic permission catalog (aggregated from every module; single source) ──
/**
 * Every permission in the system. Each module owns its own `*_PERMISSIONS` constant; this is the aggregation
 * point the RBAC layer (roles, the PermissionGuard, the UI) reads. Adding a feature → add its permission to the
 * owning module, then include it here.
 */
export const PERMISSION_CATALOG = [
  ...Object.values(CATALOG_PERMISSIONS),
  ...Object.values(CATEGORY_PERMISSIONS),
  ...Object.values(BRAND_PERMISSIONS),
  ...Object.values(UNIT_PERMISSIONS),
  ...Object.values(SUPPLIER_PERMISSIONS),
  ...Object.values(CUSTOMER_PERMISSIONS),
  ...Object.values(WAREHOUSE_PERMISSIONS),
  ...Object.values(LOCATION_PERMISSIONS),
  ...Object.values(INVENTORY_PERMISSIONS),
  ...Object.values(PURCHASE_ORDER_PERMISSIONS),
  ...Object.values(SALES_ORDER_PERMISSIONS),
  ...Object.values(TRANSFER_PERMISSIONS),
  ...Object.values(RETURN_PERMISSIONS),
  ...Object.values(REPORT_PERMISSIONS),
  ...Object.values(DASHBOARD_PERMISSIONS),
  ...Object.values(AUDIT_PERMISSIONS),
  ...Object.values(NOTIFICATION_PERMISSIONS),
  ...Object.values(SETTINGS_PERMISSIONS),
  ...Object.values(BILLING_PERMISSIONS),
  ...Object.values(POS_PERMISSIONS),
  ...Object.values(MEMBER_PERMISSIONS),
  ...Object.values(ROLE_PERMISSIONS),
] as const;
/** A permission string literal (the union of the whole catalog). */
export type Permission = (typeof PERMISSION_CATALOG)[number];

// ─── System roles (rbac.md §System roles) ─────────────────────────────────────────
/** The seven built-in role ids. A separate platform Super Admin operates the SaaS and is not a tenant role. */
export const SYSTEM_ROLE_IDS = [
  'owner',
  'admin',
  'inventory_manager',
  'purchasing_manager',
  'sales_fulfillment',
  'warehouse_staff',
  'viewer',
] as const;
export type SystemRoleId = (typeof SYSTEM_ROLE_IDS)[number];

export interface SystemRole {
  id: SystemRoleId;
  name: string;
  description: string;
  permissions: readonly Permission[];
}

/** All permissions ending in `.view` — the read-only baseline the Viewer/Auditor role is built on. */
const VIEW_PERMISSIONS: readonly Permission[] = PERMISSION_CATALOG.filter((p) => p.endsWith('.view'));

/**
 * The built-in role → permission bundles. Owner has everything; Admin has everything except transferring
 * billing ownership (`billing.manage`, the Owner's prerogative); the operational roles get least-privilege
 * bundles; Viewer/Auditor is read-only across the product plus report/audit export.
 */
export const SYSTEM_ROLES: readonly SystemRole[] = [
  {
    id: 'owner',
    name: 'Organization Owner',
    description: 'Full control of the organization, including billing and ownership transfer.',
    permissions: [...PERMISSION_CATALOG],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Manage members, roles, settings and all inventory operations.',
    permissions: PERMISSION_CATALOG.filter((p) => p !== BILLING_PERMISSIONS.manage),
  },
  {
    id: 'inventory_manager',
    name: 'Inventory Manager',
    description: 'Full inventory operations: catalog, stock, locations and transfers.',
    permissions: [
      CATALOG_PERMISSIONS.view,
      CATALOG_PERMISSIONS.create,
      CATALOG_PERMISSIONS.update,
      CATALOG_PERMISSIONS.delete,
      CATALOG_PERMISSIONS.import,
      CATEGORY_PERMISSIONS.view,
      CATEGORY_PERMISSIONS.manage,
      BRAND_PERMISSIONS.view,
      BRAND_PERMISSIONS.manage,
      UNIT_PERMISSIONS.view,
      UNIT_PERMISSIONS.manage,
      SUPPLIER_PERMISSIONS.view,
      CUSTOMER_PERMISSIONS.view,
      WAREHOUSE_PERMISSIONS.view,
      WAREHOUSE_PERMISSIONS.manage,
      LOCATION_PERMISSIONS.view,
      LOCATION_PERMISSIONS.manage,
      INVENTORY_PERMISSIONS.view,
      INVENTORY_PERMISSIONS.adjust,
      TRANSFER_PERMISSIONS.view,
      TRANSFER_PERMISSIONS.manage,
      PURCHASE_ORDER_PERMISSIONS.view,
      SALES_ORDER_PERMISSIONS.view,
      RETURN_PERMISSIONS.view,
      REPORT_PERMISSIONS.view,
      REPORT_PERMISSIONS.export,
      DASHBOARD_PERMISSIONS.view,
      AUDIT_PERMISSIONS.view,
      NOTIFICATION_PERMISSIONS.view,
      SETTINGS_PERMISSIONS.view,
    ],
  },
  {
    id: 'purchasing_manager',
    name: 'Purchasing Manager',
    description: 'Manage suppliers, purchase orders and receiving.',
    permissions: [
      CATALOG_PERMISSIONS.view,
      CATEGORY_PERMISSIONS.view,
      BRAND_PERMISSIONS.view,
      UNIT_PERMISSIONS.view,
      SUPPLIER_PERMISSIONS.view,
      SUPPLIER_PERMISSIONS.manage,
      WAREHOUSE_PERMISSIONS.view,
      LOCATION_PERMISSIONS.view,
      INVENTORY_PERMISSIONS.view,
      PURCHASE_ORDER_PERMISSIONS.view,
      PURCHASE_ORDER_PERMISSIONS.manage,
      RETURN_PERMISSIONS.view,
      RETURN_PERMISSIONS.manage,
      REPORT_PERMISSIONS.view,
      DASHBOARD_PERMISSIONS.view,
      NOTIFICATION_PERMISSIONS.view,
    ],
  },
  {
    id: 'sales_fulfillment',
    name: 'Sales / Fulfillment',
    description: 'Manage customers, sales orders and fulfillment.',
    permissions: [
      CATALOG_PERMISSIONS.view,
      CATEGORY_PERMISSIONS.view,
      BRAND_PERMISSIONS.view,
      UNIT_PERMISSIONS.view,
      CUSTOMER_PERMISSIONS.view,
      CUSTOMER_PERMISSIONS.manage,
      WAREHOUSE_PERMISSIONS.view,
      LOCATION_PERMISSIONS.view,
      INVENTORY_PERMISSIONS.view,
      SALES_ORDER_PERMISSIONS.view,
      SALES_ORDER_PERMISSIONS.manage,
      RETURN_PERMISSIONS.view,
      RETURN_PERMISSIONS.manage,
      POS_PERMISSIONS.sell,
      POS_PERMISSIONS.view,
      REPORT_PERMISSIONS.view,
      DASHBOARD_PERMISSIONS.view,
      NOTIFICATION_PERMISSIONS.view,
    ],
  },
  {
    id: 'warehouse_staff',
    name: 'Warehouse Staff',
    description: 'Execute stock movements: adjustments, counts and transfers.',
    permissions: [
      CATALOG_PERMISSIONS.view,
      WAREHOUSE_PERMISSIONS.view,
      LOCATION_PERMISSIONS.view,
      INVENTORY_PERMISSIONS.view,
      INVENTORY_PERMISSIONS.adjust,
      TRANSFER_PERMISSIONS.view,
      TRANSFER_PERMISSIONS.manage,
      PURCHASE_ORDER_PERMISSIONS.view,
      SALES_ORDER_PERMISSIONS.view,
      RETURN_PERMISSIONS.view,
      POS_PERMISSIONS.sell,
      POS_PERMISSIONS.view,
      DASHBOARD_PERMISSIONS.view,
      NOTIFICATION_PERMISSIONS.view,
    ],
  },
  {
    id: 'viewer',
    name: 'Viewer / Auditor',
    description: 'Read-only access across inventory, reports and the audit trail.',
    permissions: [...VIEW_PERMISSIONS, REPORT_PERMISSIONS.export, AUDIT_PERMISSIONS.export],
  },
];

/** Resolve the effective permission set for a set of roles — the union, deny-by-default (rbac.md §Rules). */
export function permissionsForRoles(roleIds: readonly SystemRoleId[]): Permission[] {
  const granted = new Set<Permission>();
  for (const roleId of roleIds) {
    const role = SYSTEM_ROLES.find((r) => r.id === roleId);
    if (role) for (const permission of role.permissions) granted.add(permission);
  }
  return [...granted];
}

// ─── Shared field schemas ─────────────────────────────────────────────────────────
const email = z.string().trim().min(3).max(200).email();
/** New-password policy. Login accepts any non-empty string (never reveal the policy to attackers). */
const newPassword = z.string().min(8).max(128);
const personName = z.string().trim().min(1).max(100);
const roleIds = z.array(z.enum(SYSTEM_ROLE_IDS)).min(1).max(SYSTEM_ROLE_IDS.length);

// ─── Requests ─────────────────────────────────────────────────────────────────────
/** Self-serve signup — creates the organization and its first member as Owner. */
export const RegisterRequestSchema = z
  .object({
    organizationName: z.string().trim().min(2).max(100),
    name: personName,
    email,
    password: newPassword,
  })
  .strict();
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Invite a person to the active organization with one or more roles. */
export const InviteMemberRequestSchema = z.object({ email, roleIds }).strict();
export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;

/** Accept an invitation — creates the user account (name + password) and joins the org. */
export const AcceptInvitationRequestSchema = z
  .object({ token: z.string().min(1).max(256), name: personName, password: newPassword })
  .strict();
export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;

/** Replace a member's roles (deny-by-default; the last Owner cannot be demoted). */
export const UpdateMemberRolesRequestSchema = z.object({ roleIds }).strict();
export type UpdateMemberRolesRequest = z.infer<typeof UpdateMemberRolesRequestSchema>;

// ─── Responses ──────────────────────────────────────────────────────────────────
export const RoleSummarySchema = z.object({ id: z.enum(SYSTEM_ROLE_IDS), name: z.string() });
export type RoleSummary = z.infer<typeof RoleSummarySchema>;

/** The authenticated principal — returned by register/login/accept and `GET /auth/me`. */
export const AuthUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  roles: z.array(RoleSummarySchema),
  /** Flattened effective permissions — the UI mirrors these for UX; the server remains the enforcement point. */
  permissions: z.array(z.string()),
});
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;

export const MEMBER_STATUSES = ['active', 'invited'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/** A row in the org's people list — an active membership or a pending invitation. */
export const MemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  email: z.string(),
  name: z.string().nullable(),
  roles: z.array(RoleSummarySchema),
  status: z.enum(MEMBER_STATUSES),
  createdAt: z.string(),
});
export type MemberResponse = z.infer<typeof MemberResponseSchema>;

export const MemberListResponseSchema = z.object({ data: z.array(MemberResponseSchema) });
export type MemberListResponse = z.infer<typeof MemberListResponseSchema>;

/**
 * The created invitation. `acceptToken`/`acceptUrl` are returned now because email delivery (Resend) is a
 * documented follow-up; in production the token is emailed to the invitee, never returned to the caller.
 */
export const InvitationResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  roles: z.array(RoleSummarySchema),
  expiresAt: z.string(),
  createdAt: z.string(),
  acceptToken: z.string(),
  acceptUrl: z.string(),
});
export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

export const RoleResponseSchema = z.object({
  id: z.enum(SYSTEM_ROLE_IDS),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
});
export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export const RoleListResponseSchema = z.object({ data: z.array(RoleResponseSchema) });
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>;

/** Generic success acknowledgement (logout, remove member). */
export const AuthMessageResponseSchema = z.object({ success: z.literal(true) });
export type AuthMessageResponse = z.infer<typeof AuthMessageResponseSchema>;
