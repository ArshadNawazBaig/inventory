/**
 * Static content for the marketing landing page. Kept as data (not JSX) so copy is editable in one
 * place and the section components stay presentational. Icons reference the shared `@stockflow/icons`
 * aliases so the visual language matches the product UI.
 */
import {
  type LucideIcon,
  AuditIcon,
  DashboardIcon,
  MembersIcon,
  ProductsIcon,
  PurchaseOrderIcon,
  ReportIcon,
  UserIcon,
} from '@stockflow/icons';

/** A single capability tile in the feature grid. */
export interface MarketingFeature {
  /** Stable React key + heading. */
  readonly title: string;
  /** One-to-two sentence, concrete description of the capability. */
  readonly description: string;
  /** Decorative icon shown above the title. */
  readonly icon: LucideIcon;
}

/** A platform role surfaced in the "built for every team" section. */
export interface MarketingRole {
  readonly name: string;
  readonly summary: string;
}

/** A column of links in the footer. */
export interface FooterColumn {
  readonly heading: string;
  readonly links: ReadonlyArray<{ readonly label: string; readonly href: string }>;
}

/** Headline stats shown beneath the hero — directional product capabilities, not live metrics. */
export const HERO_STATS: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
  { value: '100k+', label: 'SKUs per tenant' },
  { value: 'Immutable', label: 'Audited stock ledger' },
  { value: '7', label: 'Built-in roles' },
  { value: 'Real-time', label: 'Dashboard & alerts' },
];

/** The six headline capabilities, mapped to real StockFlow modules. */
export const FEATURES: ReadonlyArray<MarketingFeature> = [
  {
    title: 'Immutable stock ledger',
    description:
      'Every movement is recorded as an append-only entry, so on-hand quantities are always a reconcilable projection — never an editable guess.',
    icon: AuditIcon,
  },
  {
    title: 'Multi-tenant RBAC',
    description:
      'Granular permissions bundle into system and custom roles, scoped per organization and deny-by-default. The UI mirrors a check that is always enforced server-side.',
    icon: MembersIcon,
  },
  {
    title: 'Orders, transfers & returns',
    description:
      'Run purchasing with receiving and weighted-average costing, sales with fulfillment, two-leg stock transfers, and customer or supplier returns end to end.',
    icon: PurchaseOrderIcon,
  },
  {
    title: 'Real-time dashboard & analytics',
    description:
      'Live KPIs, open-work counts, and recent activity stream in over websockets, so the warehouse floor and the back office see the same numbers at the same moment.',
    icon: DashboardIcon,
  },
  {
    title: 'Valuation & low-stock reporting',
    description:
      'Inventory valuation and low-stock analytics turn the ledger into decisions — know what each location is worth and what to reorder before you run out.',
    icon: ReportIcon,
  },
  {
    title: 'Catalog built for scale',
    description:
      'A Product → Variant → Stock model across hierarchical Warehouse → Zone → Bin locations, designed to stay fast at 100k+ SKUs per tenant.',
    icon: ProductsIcon,
  },
];

/** The seven roles the platform ships with out of the box. */
export const ROLES: ReadonlyArray<MarketingRole> = [
  { name: 'Organization Owner', summary: 'Full control of the tenant, billing, and members.' },
  { name: 'Admin', summary: 'Manage settings, roles, and the catalog.' },
  { name: 'Inventory Manager', summary: 'Own stock levels, adjustments, and counts.' },
  { name: 'Purchasing Manager', summary: 'Raise purchase orders and receive goods.' },
  { name: 'Sales / Fulfillment', summary: 'Process sales orders and ship to customers.' },
  { name: 'Warehouse Staff', summary: 'Pick, pack, transfer, and count on the floor.' },
  { name: 'Viewer / Auditor', summary: 'Read-only access to reports and the audit trail.' },
];

/** Footer link groups. Auth links are real; the rest are in-page placeholders for now. */
export const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Roles', href: '#roles' },
      { label: 'Get started', href: '/register' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
];

/** Icon used by the role section header. Exported so the section component stays data-driven. */
export const ROLE_SECTION_ICON: LucideIcon = UserIcon;
