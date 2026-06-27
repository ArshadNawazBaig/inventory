import type { LucideIcon } from '@stockflow/icons';
import {
  BrandIcon,
  CategoryIcon,
  DashboardIcon,
  LocationIcon,
  MembersIcon,
  ProductIcon,
  ProductsIcon,
  PurchaseOrderIcon,
  ReportIcon,
  SalesOrderIcon,
  SettingsIcon,
  SupplierIcon,
  UnitIcon,
} from '@stockflow/icons';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Primary navigation for the authenticated app shell. Mirrors the route map in
 * .claude/frontend/routing.md — plural, kebab-case URLs matching API resources.
 * Items become permission-gated once RBAC lands (auth phase).
 */
export const APP_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: DashboardIcon }],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/products', icon: ProductIcon },
      { label: 'Categories', href: '/categories', icon: CategoryIcon },
      { label: 'Brands', href: '/brands', icon: BrandIcon },
      { label: 'Units', href: '/units', icon: UnitIcon },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inventory', href: '/inventory', icon: ProductsIcon },
      { label: 'Locations', href: '/locations', icon: LocationIcon },
    ],
  },
  {
    title: 'Partners',
    items: [
      { label: 'Suppliers', href: '/suppliers', icon: SupplierIcon },
      { label: 'Customers', href: '/customers', icon: MembersIcon },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Purchasing', href: '/purchasing', icon: PurchaseOrderIcon },
      { label: 'Sales', href: '/sales', icon: SalesOrderIcon },
      { label: 'Reports', href: '/reports', icon: ReportIcon },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Settings', href: '/settings', icon: SettingsIcon }],
  },
];
