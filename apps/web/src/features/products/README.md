# Products feature (web)

Frontend for the Product (Catalog) module. Design spec: [`docs/modules/product.md` §12](../../../../../docs/modules/product.md#12-frontend).
Built entirely on `@stockflow/ui` (cardinal rule), TanStack Query (server state), and React Hook Form + Zod (forms).

## Layout

```
../../lib/api/            apiRequest seam · typed ApiError · dev tenant headers (app-wide)
api.ts                    one function per endpoint; validates responses via shared Zod contracts
query-keys.ts             hierarchical TanStack Query key factory
queries.ts                useProducts (keepPreviousData) · useProduct · useVariants
mutations.ts              create/update/archive/restore/delete (+ variant ops) — own cache invalidation
lib/money.ts              major↔minor conversion (float-safe)
lib/product-form.schema.ts  form-shape schemas + request mappers (see ADR-014)
lib/form-errors.ts        map server VALIDATION_ERROR details onto RHF fields
components/               status badges · details/variant fields · create+edit form · variant dialog ·
                          products table (server-sorted) · filters · browser (URL state) · detail view
```

Pages live in [`app/(app)/products`](../../app/(app)/products): list · `new` · `[productId]` (detail) ·
`[productId]/edit` · `loading`.

## Conventions

- **Server state only in TanStack Query.** Mutations own invalidation; components own toasts, navigation,
  and field-error mapping. Server data is never mirrored into Zustand.
- **List state lives in the URL** (filters, sort, page) and drives the query — shareable + back-button safe.
  Sorting/paging is **server-driven**; we compose `Table` + `Pagination`, not the client-only `DataGrid`.
- **One contract, two shapes.** The wire contract is `@stockflow/types`; thin *form* schemas + mappers add
  UX validation and major↔minor money conversion. The API re-validates authoritatively.
- **Tenant context** is sent as dev headers **outside production only**, mirroring the API's `DevAuthGuard`;
  production derives the tenant from the session (Better Auth, later). See ADR-013.
- **Accessible forms** compose `Field` + `FieldControl` from `@stockflow/ui` — no hand-rolled label/error
  markup (ADR-012).

## Deferred (with reason)

Category/Brand/Unit pickers (need their sub-modules — currently 24-char id inputs) · image upload +
attribute editor · bulk-import UI (`POST /products/import`) · permission-gated nav/actions (need RBAC) ·
component/integration tests (jsdom + Testing Library + MSW). See `docs/modules/product.md §12.3`.

## Tests

Pure-logic vitest suite (`pnpm --filter @stockflow/web test`): money conversion, form→request mappers,
API error parsing, query keys. The `Field` primitive is covered by RTL tests in `@stockflow/ui`.
