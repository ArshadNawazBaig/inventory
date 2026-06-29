import type { LucideIcon } from '@stockflow/icons';
import {
  AuditIcon,
  BillingIcon,
  BrandIcon,
  CategoryIcon,
  DashboardIcon,
  LocationIcon,
  MembersIcon,
  PosIcon,
  ProductIcon,
  ProductsIcon,
  PurchaseOrderIcon,
  ReportIcon,
  ReturnIcon,
  SalesOrderIcon,
  SettingsIcon,
  SupplierIcon,
  TransferIcon,
  UnitIcon,
  UserIcon,
  WarehouseIcon,
} from '@stockflow/icons';
import {
  AUDIT_PERMISSIONS,
  BILLING_PERMISSIONS,
  BRAND_PERMISSIONS,
  CATALOG_PERMISSIONS,
  CATEGORY_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  DASHBOARD_PERMISSIONS,
  INVENTORY_PERMISSIONS,
  LOCATION_PERMISSIONS,
  MEMBER_PERMISSIONS,
  POS_PERMISSIONS,
  PURCHASE_ORDER_PERMISSIONS,
  REPORT_PERMISSIONS,
  RETURN_PERMISSIONS,
  SALES_ORDER_PERMISSIONS,
  SETTINGS_PERMISSIONS,
  SUPPLIER_PERMISSIONS,
  TRANSFER_PERMISSIONS,
  UNIT_PERMISSIONS,
  WAREHOUSE_PERMISSIONS,
} from '@stockflow/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** The permission required to see this item. The shell filters by the session's effective permissions. */
  permission: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Primary navigation for the authenticated app shell. Mirrors the route map in
 * .claude/frontend/routing.md — plural, kebab-case URLs matching API resources. Each item declares the
 * permission required to see it; the shell hides items (and empty groups) the actor cannot access. This is a
 * UX mirror — the API still enforces every permission server-side.
 */
export const APP_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon, permission: DASHBOARD_PERMISSIONS.view },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/products', icon: ProductIcon, permission: CATALOG_PERMISSIONS.view },
      { label: 'Categories', href: '/categories', icon: CategoryIcon, permission: CATEGORY_PERMISSIONS.view },
      { label: 'Brands', href: '/brands', icon: BrandIcon, permission: BRAND_PERMISSIONS.view },
      { label: 'Units', href: '/units', icon: UnitIcon, permission: UNIT_PERMISSIONS.view },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inventory', href: '/inventory', icon: ProductsIcon, permission: INVENTORY_PERMISSIONS.view },
      { label: 'Warehouses', href: '/warehouses', icon: WarehouseIcon, permission: WAREHOUSE_PERMISSIONS.view },
      { label: 'Locations', href: '/locations', icon: LocationIcon, permission: LOCATION_PERMISSIONS.view },
    ],
  },
  {
    title: 'Partners',
    items: [
      { label: 'Suppliers', href: '/suppliers', icon: SupplierIcon, permission: SUPPLIER_PERMISSIONS.view },
      { label: 'Customers', href: '/customers', icon: UserIcon, permission: CUSTOMER_PERMISSIONS.view },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Point of Sale', href: '/pos', icon: PosIcon, permission: POS_PERMISSIONS.view },
      {
        label: 'Purchasing',
        href: '/purchasing',
        icon: PurchaseOrderIcon,
        permission: PURCHASE_ORDER_PERMISSIONS.view,
      },
      { label: 'Sales', href: '/sales', icon: SalesOrderIcon, permission: SALES_ORDER_PERMISSIONS.view },
      { label: 'Transfers', href: '/transfers', icon: TransferIcon, permission: TRANSFER_PERMISSIONS.view },
      { label: 'Returns', href: '/returns', icon: ReturnIcon, permission: RETURN_PERMISSIONS.view },
      { label: 'Reports', href: '/reports', icon: ReportIcon, permission: REPORT_PERMISSIONS.view },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Members', href: '/members', icon: MembersIcon, permission: MEMBER_PERMISSIONS.view },
      { label: 'Audit log', href: '/audit-logs', icon: AuditIcon, permission: AUDIT_PERMISSIONS.view },
      { label: 'Billing', href: '/billing', icon: BillingIcon, permission: BILLING_PERMISSIONS.view },
      { label: 'Settings', href: '/settings', icon: SettingsIcon, permission: SETTINGS_PERMISSIONS.view },
    ],
  },
];
