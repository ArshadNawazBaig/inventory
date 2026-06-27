import { type CustomDecorator, SetMetadata } from '@nestjs/common';

/** Metadata key holding the permissions a route requires. */
export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declares the permission(s) a route requires. The RBAC PermissionGuard (added with
 * the auth module) reads this metadata and enforces it server-side, deny-by-default.
 * Encoded now so endpoints document their authorization contract.
 */
export const RequirePermission = (...permissions: string[]): CustomDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
