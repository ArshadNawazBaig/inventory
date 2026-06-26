# Repository Structure

| Field | Value |
|-------|-------|
| **Document** | Monorepo / Repository Structure (Turborepo) |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Principal Architect |
| **Date** | 2026-06-26 |
| **Related** | [ARCHITECTURE.md](./ARCHITECTURE.md) · [CODING_STANDARDS.md](./CODING_STANDARDS.md) · [.claude/architecture/monorepo.md](../.claude/architecture/monorepo.md) |

> Principle: **a predictable place for everything, and clear boundaries between everything.**
> `apps/*` are deployable; `packages/*` are shared and never deployed on their own; tooling and
> ops live at the root. Dependencies point one way: `apps → packages → (leaf packages)`.

---

## 1. Why Turborepo

A single repo holds the web app, API, worker, and all shared code. Turborepo gives us:

- **Task orchestration with a dependency graph** — `turbo run build` builds packages in the right
  order (a package is built before the app that imports it).
- **Caching** — unchanged packages are never rebuilt/retested; CI only does work that's actually
  affected by a change. Optional **remote cache** shares results across the team and CI.
- **One command surface** — `lint`, `typecheck`, `test`, `build`, `dev` work identically across
  every app and package.
- **Incremental, affected-only CI** — fast feedback as the repo grows.

We pair it with **pnpm workspaces** (fast, strict, disk-efficient installs with a single lockfile).

---

## 2. Top-level tree

```
stockflow/
├── apps/                     # Deployable applications (one process each)
│   ├── web/                  # Next.js frontend
│   ├── api/                  # NestJS REST API
│   └── worker/               # NestJS BullMQ background worker
│
├── packages/                 # Shared, versioned internal libraries (not deployed)
│   ├── ui/                   # Design system / component library (the ONLY source of UI)
│   ├── icons/                # Icon set as components
│   ├── hooks/                # Shared React hooks
│   ├── types/                # Shared contracts: Zod schemas + inferred TS types
│   ├── utils/                # Framework-agnostic helpers
│   ├── config/              # Shared runtime config, constants, env schema, tool presets
│   ├── eslint-config/        # Shared ESLint rule sets
│   └── tsconfig/             # Shared TypeScript base configs
│
├── infrastructure/           # Ops: docker, compose, IaC, Railway config
├── scripts/                  # Repo-wide dev/ops scripts (seed, codegen, migrations)
├── docs/                     # Product & engineering documentation (this folder)
├── .claude/                  # AI engineering knowledge base & operating rules
│
├── .github/                  # CI/CD workflows, PR/issue templates, CODEOWNERS, Dependabot
├── .changeset/               # Changesets for versioning & changelogs
├── .husky/                   # Git hooks (pre-commit, commit-msg)
├── .vscode/                  # Recommended editor settings & extensions
│
├── turbo.json                # Turborepo task pipeline & cache config
├── pnpm-workspace.yaml       # Declares which globs are workspaces
├── package.json              # Root manifest: workspace scripts & dev tooling only
├── pnpm-lock.yaml            # Single lockfile for the whole repo
├── tsconfig.json             # Root TS config (project references → packages/tsconfig)
├── .npmrc                    # pnpm settings (strictness, hoisting)
├── .nvmrc                    # Pinned Node version (parity across machines & CI)
├── .editorconfig             # Editor-agnostic formatting baseline
├── .gitignore                # Ignored files (node_modules, .env, build output, .turbo)
├── .dockerignore             # Excludes from Docker build context
├── .env.example              # Documented env keys (NO values)
├── prettier.config.mjs       # Formatting rules (shared)
├── commitlint.config.mjs     # Conventional-commit enforcement
├── LICENSE
└── README.md                 # Repo entry point: setup, commands, structure
```

---

## 3. `apps/` — deployable applications

**Why it exists:** isolates the three independently deployable processes. Each app has its own
`package.json`, `tsconfig.json`, `Dockerfile`, and lifecycle, but shares code via `packages/*`.
**Rule:** apps may depend on packages, **never on each other** — shared logic moves into a package.

### `apps/web/` — Next.js frontend
The customer-facing UI. **Why separate:** different runtime (browser/Next server), build, and
deploy target than the API.

```
apps/web/
├── src/
│   ├── app/            # App Router routes (route groups by domain) — thin; no business logic
│   ├── features/       # Feature modules: components + hooks + queries + schemas, colocated
│   ├── components/     # App-specific compositions built FROM @stockflow/ui (not primitives)
│   ├── lib/            # API client, TanStack Query client, Better Auth client, helpers
│   ├── stores/         # Zustand stores (global client UI state only)
│   ├── styles/         # globals.css + Tailwind v4 entry (imports design-system theme)
│   └── middleware.ts   # Edge middleware (auth/session, redirects)
├── public/             # Static assets served as-is
├── next.config.ts
├── Dockerfile
├── package.json
└── tsconfig.json       # extends packages/tsconfig/nextjs.json
```
- **`app/`** — routing only; pages delegate to `features/`. Keeps routes thin and testable.
- **`features/`** — feature-first colocation so a feature's UI, data hooks, and schemas live together.
- **`components/`** — *compositions* of design-system primitives; **primitives themselves live in `packages/ui`**, never here.
- **`lib/` / `stores/`** — wiring (clients) and global UI state, kept out of components.

### `apps/api/` — NestJS REST API
The system of record's HTTP surface. **Why separate:** server-only, holds secrets, talks to
MongoDB/Redis; scales independently of the web app.

```
apps/api/
├── src/
│   ├── modules/<feature>/      # One module per bounded context (Clean Architecture inside)
│   │   ├── domain/             # Entities, value objects, domain rules (framework-free)
│   │   ├── application/        # Use cases + ports (interfaces)
│   │   ├── infrastructure/     # Mongoose schemas, repositories, adapters (implement ports)
│   │   ├── presentation/       # Controllers, DTOs, mappers
│   │   └── <feature>.module.ts
│   ├── common/                 # Guards, interceptors, filters, pipes, decorators (cross-cutting)
│   ├── config/                 # Env loading + validation (uses @stockflow/config schema)
│   ├── database/               # Mongo connection, base (tenant-scoped) repository, migrations
│   ├── app.module.ts
│   └── main.ts                 # Bootstrap (Swagger, security middleware, etc.)
├── test/                       # e2e / integration tests (*.e2e-spec.ts)
├── Dockerfile
├── package.json
└── tsconfig.json               # extends packages/tsconfig/nestjs.json
```
- **`modules/`** — the heart; each context (Catalog, Inventory, …) is isolated and layered so
  dependencies point inward (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
- **`common/`** — where auth, RBAC, tenant-context, logging, and error-mapping live once.
- **`database/`** — the tenant-scoping base repository lives here so isolation can't be forgotten.

### `apps/worker/` — NestJS BullMQ worker
Consumes queues for heavy/async work (imports, exports, reports, emails, webhooks, alerts).
**Why separate:** runs without serving HTTP, scales by queue depth, and must not slow API requests.

```
apps/worker/
├── src/
│   ├── processors/<queue>/   # One folder per queue; thin, idempotent consumers
│   ├── jobs/                 # Typed job definitions & payload schemas (from @stockflow/types)
│   ├── config/               # Env loading + validation
│   └── main.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 4. `packages/` — shared internal libraries

**Why it exists:** the DRY backbone. Anything used by more than one app (or worth isolating) lives
here, versioned and import-boundary-enforced. Packages are **never deployed alone** — they're
consumed by apps. Internal package names use a scope, e.g. `@stockflow/ui`.

### `packages/ui/` — design system & component library
**Why:** the single source of all UI (PRD rule: never build UI in pages). Built on Radix + shadcn.

```
packages/ui/
├── src/
│   ├── primitives/   # Button, Input, Modal, Table, … (the base components)
│   ├── components/   # Higher-level composites assembled from primitives
│   ├── lib/          # cn()/variant helpers
│   ├── styles/       # Tailwind v4 theme (@theme tokens): colors, type, spacing, radius, motion
│   └── index.ts      # Public surface (what apps may import)
├── .storybook/       # Storybook config — components documented & a11y-checked in isolation
├── package.json
└── tsconfig.json     # extends packages/tsconfig/react-library.json
```
- **`styles/`** owns the **design tokens** (Tailwind v4 is CSS-first via `@theme`); apps import this
  theme so light/dark and branding are consistent everywhere.
- **`.storybook/`** makes every component documented and testable in isolation (PRD: Storybook-ready).

### `packages/icons/` — icon set
**Why:** one curated, consistent icon library exposed as typed components, sized/colored by tokens.
Keeps one-off SVGs out of features and guarantees visual consistency.
```
packages/icons/src/{icons/, index.ts}
```

### `packages/hooks/` — shared React hooks
**Why:** reusable client behavior (e.g., `useDebounce`, `useMediaQuery`, `usePermission`) shared by
`web` and `ui` without duplication. UI-specific hooks may live in `ui`; cross-cutting ones live here.

### `packages/types/` — shared contracts (the most important package)
**Why:** the **single source of truth for data shapes**. Zod schemas live here; static types are
`z.infer`-ed from them. The same schema validates an API request (DTO) *and* a web form *and*
a queue job payload — so the contract can never drift between frontend, backend, and worker.
```
packages/types/src/
├── common/            # shared primitives: ids, pagination, error codes, enums
├── <domain>/          # per-domain schemas (catalog, inventory, procurement, …)
└── index.ts
```
This is what makes "validate input and output" enforceable across the whole stack.

### `packages/utils/` — framework-agnostic helpers
**Why:** pure functions (money math, date/UTC helpers, formatting, result types) usable anywhere.
**Leaf package**: depends on nothing internal, so it never creates cycles.

### `packages/config/` — shared runtime config, constants & tool presets
**Why:** one home for cross-app constants (permission catalog keys, status enums, limits), the
**environment-variable Zod schema** (each app's `src/config` loads + validates with it), and shared
tool presets (e.g., PostCSS/Tailwind setup). Centralizes "what must be configured" and fails fast.

### `packages/eslint-config/` — shared lint rules
**Why:** one ruleset, extended by every app/package, so quality rules (no `any`, import boundaries,
a11y) are identical everywhere. Variants per target:
```
packages/eslint-config/{base, react, next, nest}.js
```

### `packages/tsconfig/` — shared TypeScript configs
**Why:** one strict base extended everywhere — strictness and compiler options never drift.
```
packages/tsconfig/{base.json, nextjs.json, nestjs.json, react-library.json}
```

> **Dependency direction inside `packages/`:** `types` and `utils` are leaves (no internal deps);
> `ui` may use `icons`, `hooks`, `utils`; apps use any package. No cycles — enforced in lint/CI.

---

## 5. Root-level operational folders

### `infrastructure/` — ops & deployment assets
**Why:** keep ops artifacts versioned but out of app code.
```
infrastructure/
├── docker/            # docker-compose.yml (dev: MongoDB + Redis), prod compose/overrides
├── railway/           # Railway service/environment config
└── (iac/)             # future infra-as-code
```

### `scripts/` — repo-wide automation
**Why:** one place for tasks that span apps/packages — DB **seeding**, data **migrations**,
**codegen** (e.g., OpenAPI → client types), and developer convenience scripts. Invoked via root
`package.json` and Turbo.

### `docs/` — product & engineering documentation
**Why:** the canonical, human-readable design record (PRD, ROADMAP, ARCHITECTURE, DATABASE, …).
Markdown, reviewed and approved per our documentation-first process. (See the note in §7 about
`packages/docs` vs `docs/`.)

### `.claude/` — AI engineering knowledge base
**Why:** the operating rules and context the AI assistant follows while building (constitution +
per-area guides). Complements `docs/` (canonical specs) with day-to-day "how we work" rules.

---

## 6. Root-level config & tooling files

| File / folder | Why it exists |
|---------------|---------------|
| **`turbo.json`** | Defines the task pipeline (`build`/`dev`/`lint`/`typecheck`/`test`), `dependsOn` ordering, cache inputs/outputs. The brain of the monorepo. |
| **`pnpm-workspace.yaml`** | Tells pnpm which globs (`apps/*`, `packages/*`) are workspaces. |
| **`package.json` (root)** | **Private**; holds only workspace-wide scripts and dev tooling — no app dependencies. |
| **`pnpm-lock.yaml`** | One lockfile for the entire repo → reproducible installs everywhere. |
| **`tsconfig.json` (root)** | Project-references entry pointing at `packages/tsconfig`; enables fast incremental builds. |
| **`.npmrc`** | pnpm behavior (hoisting/strictness) for consistent, safe installs. |
| **`.nvmrc`** | Pins the Node version so all machines + CI match. |
| **`.editorconfig`** | Baseline whitespace/encoding rules across editors. |
| **`.gitignore` / `.dockerignore`** | Exclude `node_modules`, `.env*`, build output, `.turbo` from git / Docker context (smaller, safer builds). |
| **`.env.example`** | Documents required env keys (no values) — onboarding + secret hygiene. |
| **`prettier.config.mjs`** | One formatting standard, no style debates. |
| **`commitlint.config.mjs`** | Enforces conventional commits (powers changelogs/automation). |
| **`.husky/`** | Git hooks: pre-commit (lint-staged) + commit-msg (commitlint) catch issues before CI. |
| **`.changeset/`** | Tracks intended version bumps + changelog entries per change. |
| **`.github/`** | CI/CD workflows, PR/issue templates, `CODEOWNERS`, Dependabot config. |
| **`.vscode/`** | Recommended workspace settings + extensions for a consistent dev experience. |
| **`README.md`** | The front door: what this is, how to set up, the command catalog, structure overview. |

---

## 7. Notes & decisions

- **`docs/` location.** The brief's monorepo sketch listed `docs` under `packages/`. We use a
  **root `docs/`** for the markdown knowledge base (resolved open question #4) because it isn't a
  buildable package — it's documentation that spans the whole repo. If we later want a *rendered*
  docs site, it becomes its own deployable as **`apps/docs`** (e.g., Nextra), leaving the markdown
  source in `docs/`. No `packages/docs` for now.
- **Internal package scope.** Packages are published only inside the workspace under a scope
  (`@stockflow/ui`, `@stockflow/types`, …); they are not pushed to a public registry.
- **Boundaries are enforced, not just documented.** ESLint import rules + dependency checks fail CI
  on `app → app` imports or cycles (see [.claude/architecture/dependency-rules.md](../.claude/architecture/dependency-rules.md)).
- **Tailwind v4 is CSS-first.** Design tokens live in `packages/ui/src/styles` (`@theme`); apps
  import that theme rather than each defining their own.

---

## 8. Conventions

- **Folders:** `kebab-case`. **Feature folders:** singular domain noun (`product`, `inventory`).
- **One feature = one folder**, colocating everything it needs; `index.ts` barrels expose only the
  public surface.
- **Tests live beside source:** `*.spec.ts` (unit), `*.e2e-spec.ts` (integration/e2e).
- **No deep relative imports across packages** — import via the package's public entry
  (`@stockflow/ui`), never `../../../packages/ui/src/...`.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Principal Architect / CTO | ☐ Approved ☐ Changes requested | |
