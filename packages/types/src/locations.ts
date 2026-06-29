import { z } from 'zod';
import { PageMetaSchema } from './catalog';
import { LOOKUP_STATUS } from './catalog-lookups';
import { AddressInputSchema, AddressSchema } from './parties';

/**
 * Locations contracts (Warehouses · Locations) — the single source of truth for validation AND types,
 * shared by API + worker + web. See docs/modules/locations.md. A warehouse is a physical site; locations
 * form a per-warehouse Warehouse → Zone → … → Bin tree (DATABASE §5, ADR-004). Stock is tracked at a
 * `locationId`; the materialized `path` powers subtree roll-ups.
 */

// ─── Permissions ───────────────────────────────────────────────────────────────
export const WAREHOUSE_PERMISSIONS = { view: 'warehouse.view', manage: 'warehouse.manage' } as const;
export const LOCATION_PERMISSIONS = { view: 'location.view', manage: 'location.manage' } as const;
export type LocationsPermission =
  | (typeof WAREHOUSE_PERMISSIONS)[keyof typeof WAREHOUSE_PERMISSIONS]
  | (typeof LOCATION_PERMISSIONS)[keyof typeof LOCATION_PERMISSIONS];

// ─── Enums ───────────────────────────────────────────────────────────────────
/** Granularity of a location node; depth is optional (a one-room shop may have a single zone). */
export const LOCATION_TYPES = ['zone', 'aisle', 'shelf', 'bin'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/**
 * Kind of stockable site. A `warehouse` is back-stock; a `store` is a retail location that sells from its own
 * stock (the Point-of-Sale sells from a store's locations). Both share the same entity + inventory + transfer
 * machinery — the type is the only distinction.
 */
export const SITE_TYPES = ['warehouse', 'store'] as const;
export type SiteType = (typeof SITE_TYPES)[number];

// ─── Reusable field schemas ──────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a 24-character hex id');
const nameField = z.string().trim().min(1, 'Name is required').max(160);
const codeField = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(40)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_\-/]*$/, 'Letters, numbers, hyphen, underscore and slash only');

// ─── Warehouse ───────────────────────────────────────────────────────────────
export const CreateWarehouseRequestSchema = z
  .object({
    name: nameField,
    type: z.enum(SITE_TYPES).optional(),
    code: codeField.optional(),
    address: AddressInputSchema.optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();
export type CreateWarehouseRequest = z.infer<typeof CreateWarehouseRequestSchema>;

export const UpdateWarehouseRequestSchema = z
  .object({
    name: nameField,
    type: z.enum(SITE_TYPES),
    code: codeField.nullable(),
    address: AddressInputSchema.nullable(),
    isDefault: z.boolean(),
  })
  .partial()
  .strict();
export type UpdateWarehouseRequest = z.infer<typeof UpdateWarehouseRequestSchema>;

export const WarehouseResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(SITE_TYPES),
  code: z.string().nullable(),
  address: AddressSchema.nullable(),
  isDefault: z.boolean(),
  status: z.enum(LOOKUP_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WarehouseResponse = z.infer<typeof WarehouseResponseSchema>;

export const WarehouseListResponseSchema = z.object({
  data: z.array(WarehouseResponseSchema),
  meta: PageMetaSchema,
});
export type WarehouseListResponse = z.infer<typeof WarehouseListResponseSchema>;

// ─── Location ────────────────────────────────────────────────────────────────
export const CreateLocationRequestSchema = z
  .object({
    warehouseId: objectId,
    name: nameField,
    code: codeField,
    type: z.enum(LOCATION_TYPES).default('zone'),
    parentLocationId: objectId.optional(),
  })
  .strict();
export type CreateLocationRequest = z.infer<typeof CreateLocationRequestSchema>;

/** A location cannot change warehouses (it would break stock + the materialized path) — `warehouseId`
 * is intentionally absent here. */
export const UpdateLocationRequestSchema = z
  .object({
    name: nameField,
    code: codeField,
    type: z.enum(LOCATION_TYPES),
    parentLocationId: objectId.nullable(),
  })
  .partial()
  .strict();
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestSchema>;

export const LocationResponseSchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  parentLocationId: z.string().nullable(),
  path: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.enum(LOCATION_TYPES),
  status: z.enum(LOOKUP_STATUS),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LocationResponse = z.infer<typeof LocationResponseSchema>;

export const LocationListResponseSchema = z.object({
  data: z.array(LocationResponseSchema),
  meta: PageMetaSchema,
});
export type LocationListResponse = z.infer<typeof LocationListResponseSchema>;

/** Location list query — paginated, scoped/filterable by warehouse, parent and type. Defaults to `path`
 * order so a warehouse's tree reads top-down. */
export const LocationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(['path', '-path', 'code', '-code', 'name', '-name', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt'])
      .default('path'),
    status: z.enum(LOOKUP_STATUS).optional(),
    q: z.string().trim().min(1).max(100).optional(),
    warehouseId: objectId.optional(),
    parentLocationId: objectId.optional(),
    type: z.enum(LOCATION_TYPES).optional(),
  })
  .strict();
export type LocationListQuery = z.infer<typeof LocationListQuerySchema>;
