# Persistence — driver switch & the Mongoose migration pattern

StockFlow modules persist through **ports** (Symbol-token repository interfaces). The concrete adapter is
chosen at boot by the **`PERSISTENCE_DRIVER`** environment variable — so the same application code runs on an
in-process store or on MongoDB with no changes to services, contracts, or controllers.

| `PERSISTENCE_DRIVER` | Backend | Needs `MONGODB_URI` | Use |
|----------------------|---------|---------------------|-----|
| `memory` (default)   | In-process Maps | no | tests, smokes, local dev, CI |
| `mongo`              | MongoDB via Mongoose | **yes** | staging / production |

Status: **Catalog, Purchasing, Sales, Transfers, Returns, and Inventory are migrated** to Mongoose. The order
modules mint their document numbers (`PO-`/`SO-`/`TR-`/`RET-`) from a shared atomic **`counters`** collection;
**Inventory** writes the immutable ledger + projection together through a **session transaction** (the golden
rule). The remaining cross-cutting modules (Audit, Notifications, Settings, Billing) still run in-memory under
both drivers.

## The toolkit (`apps/api/src/common/persistence`)
- `repositoryProvider(token, MemoryClass, MongoClass)` — binds a repository port to the right adapter for the
  active driver. Both adapters must exist, keeping the drivers in lock-step.
- `mongoFeature([{ name, schema }])` — spread into a module's `imports`; registers the schemas **only** in
  mongo mode.
- `mongoRoot()` — spread into `AppModule.imports`; opens the single Mongoose connection (from `MONGODB_URI`)
  **only** in mongo mode, so the app boots with no database by default.

## Conventions (keep adapters in parity with the in-memory ones)
- **`_id` is the service-generated 24-hex id** (from `ObjectIdGenerator`), stored as a `String` — no native
  ObjectId conversion; the mapper is just `id ⇄ _id`.
- All id-like and tenant fields are **strings** (cross-references are resolved via query services, never
  Mongoose `populate`).
- **Every query is tenant-scoped** on `organizationId`; cross-tenant reads return null → 404.
- Soft-delete is a `deletedAt` timestamp (null = live); live-only lookups filter it.
- Uniqueness (e.g. SKU) stays enforced at the **service layer** for now (a partial-unique index is a follow-up).
- **Document sequences** (`PO-`/`SO-`/`TR-`/`RET-`) are minted by `MongoCounters` (the shared `counters`
  collection) via a single atomic `$inc` upsert keyed `"{organizationId}:{prefix}"` — race-free across
  instances. Order modules import `CountersModule`.
- **Atomic multi-document writes** (the Inventory ledger): a `LedgerWriter` port appends the immutable
  `stock_movements` entry and upserts the `stock_levels` projection inside one `session.withTransaction`. The
  in-memory writer sequences the two; the application calls `append` identically. A unique
  `{organizationId, opKey}` index is the DB-level idempotency guard. **Transactions need a replica set** —
  production Mongo / `MongoMemoryReplSet` in tests.
- The adapter **restores entity invariants** Mongo drops — e.g. an empty Mixed object comes back `undefined`,
  so map it to `{}`.

## Migrating a module (the repeatable recipe)
1. **Schemas** — `infrastructure/mongoose/schemas.ts`: a `*Doc` type (the entity with `id`→`_id`) + a
   `new Schema<*Doc>({...}, { collection, versionKey: false })`; add tenant/soft-delete indexes.
2. **Adapter** — `infrastructure/mongoose/mongo.repositories.ts`: a class implementing the **same port**,
   `@InjectModel(NAME)`, with `toEntity`/`toDoc` mappers. Use `.lean<*Doc>()` reads.
3. **Wire** — in the module: `...mongoFeature([{ name, schema }])` in `imports`, and swap each
   `{ provide: TOKEN, useClass: InMemoryX }` for `repositoryProvider(TOKEN, InMemoryX, MongoX)`.
4. **Verify** — a parity test against `mongodb-memory-server`; the rest of the suite stays green on the memory
   default.

Reference implementation: [`apps/api/src/modules/catalog`](../apps/api/src/modules/catalog/infrastructure/mongoose).

## Running on MongoDB
```bash
PERSISTENCE_DRIVER=mongo MONGODB_URI="mongodb://localhost:27017/stockflow" node apps/api/dist/main.js
```

## Verification (Catalog slice)
- **Parity test** — `mongo.repositories.test.ts` exercises the adapters against an ephemeral MongoDB
  (`mongodb-memory-server`, a dev/test-only dependency; the Mongo binary is fetched lazily).
- **Restart smoke** — boots the real server in mongo mode, writes over HTTP, **restarts the process against the
  same database**, and reads the data back (proving real persistence) + cross-tenant 404.

## Follow-ups
Migrate the remaining cross-cutting modules (Audit, Notifications, Settings, Billing — all simple
single-collection or singleton stores); partial-unique indexes (e.g. live SKU per tenant); production
connection pooling + index/migration management.
