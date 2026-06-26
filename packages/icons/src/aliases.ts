/**
 * Semantic icon aliases — prefer these in app code so the underlying glyph can change
 * globally without touching call sites. Spec: docs/ICON_SYSTEM.md §3.
 */
export {
  // Navigation / domain
  LayoutDashboard as DashboardIcon,
  Package as ProductIcon,
  Boxes as ProductsIcon,
  Box as VariantIcon,
  FolderTree as CategoryIcon,
  Tag as BrandIcon,
  Ruler as UnitIcon,
  Warehouse as WarehouseIcon,
  MapPin as LocationIcon,
  ArrowLeftRight as TransferIcon,
  SlidersHorizontal as AdjustmentIcon,
  ClipboardList as CountIcon,
  RotateCw as ReorderIcon,
  Building2 as SupplierIcon,
  ShoppingCart as PurchaseOrderIcon,
  ShoppingBag as SalesOrderIcon,
  Truck as ShipmentIcon,
  Users as MembersIcon,
  Bell as NotificationIcon,
  Settings as SettingsIcon,
  // Actions
  Plus as AddIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Ellipsis as MoreIcon,
  // Status
  CircleCheck as SuccessIcon,
  TriangleAlert as WarningIcon,
  CircleX as ErrorIcon,
  Info as InfoIcon,
} from 'lucide-react';
