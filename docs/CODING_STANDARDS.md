# Engineering Standards

| Field | Value |
|-------|-------|
| **Document** | Engineering Standards (Coding Standards & Conventions) |
| **Status** | 🟡 Awaiting approval |
| **Owner** | Principal Architect |
| **Date** | 2026-06-26 |
| **Applies to** | All apps and packages in the monorepo |
| **Related** | [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [.claude/quality/](../.claude/quality/) |

> These standards are **mandatory**. Most are enforced automatically (Prettier, ESLint, `tsc`,
> commitlint, CI gates); the rest are enforced in code review. A rule you must break needs a
> reviewed, commented justification — silent exceptions are not allowed.

## Guiding principles
- **Clean Architecture · SOLID · DRY · KISS · YAGNI.** Composition over inheritance.
- **Secure by default**, **type-safe by default**, **consistent over clever**.
- **Self-documenting code**: clear names, small units, obvious control flow.
- One canonical way to do a thing — consistency beats personal preference.

---

## 1. Naming

**General**
- Names are descriptive and intention-revealing. No abbreviations except the canonical set:
  `id`, `db`, `url`, `api`, `dto`, `qty`, `min`, `max`, `idx`.
- No single-letter names except trivial loop indices/coordinates.
- Avoid noise words (`data`, `info`, `manager`, `helper`) unless they carry real meaning.

**Casing**
| Kind | Convention | Example |
|------|-----------|---------|
| Files & folders | `kebab-case` | `stock-ledger.service.ts`, `purchase-orders/` |
| Variables, functions, methods | `camelCase` | `availableQuantity`, `postMovement()` |
| Types, interfaces, classes, enums, React components | `PascalCase` | `StockMovement`, `ProductCard` |
| Constants (compile-time) | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE` |
| React hooks | `camelCase` with `use` prefix | `usePermission` |
| Zod schema / inferred type | `XxxSchema` / `Xxx` | `ProductSchema` → `type Product` |
| Booleans | `is`/`has`/`can`/`should` prefix | `isArchived`, `canApprove` |
| Functions | start with a verb | `createOrder`, `reserveStock` |
| Env vars | `UPPER_SNAKE_CASE` (`NEXT_PUBLIC_` for browser) | `MONGODB_URI`, `NEXT_PUBLIC_APP_URL` |

**File suffixes (backend)**: `.controller.ts`, `.service.ts`, `.repository.ts`, `.module.ts`,
`.dto.ts`, `.schema.ts`, `.entity.ts`, `.guard.ts`, `.spec.ts`, `.e2e-spec.ts`.

**Don'ts**: no `I`-prefix on interfaces; no Hungarian notation; no abbreviations of domain terms
(`warehouse`, not `wh`). Do **not** invent synonyms for canonical domain terms.

**Domain, DB, and API names are canonical** — follow
[.claude/context/terminology.md](../.claude/context/terminology.md),
[.claude/database/naming.md](../.claude/database/naming.md), and
[.claude/api/naming.md](../.claude/api/naming.md). Highlights:
`organizationId` (never `orgId`/`tenantId`); collections plural `snake_case`; API resources plural
`kebab-case`; JSON bodies `camelCase`; money as integer minor units + `currency`; timestamps `…At`, UTC.

---

## 2. Folder Structure

The canonical layout is [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md). Rules that bind code:
- **Feature-first**: one feature = one folder, colocating its components/hooks/queries/schemas (web)
  or domain/application/infrastructure/presentation layers (api).
- **Barrels**: `index.ts` exposes only a module's **public surface**; internals stay private.
- **Tests live beside source** (`*.spec.ts`, `*.e2e-spec.ts`).
- **Shared code is promoted to a package** the moment a second consumer appears — never copy.
- **No UI primitives outside `@stockflow/ui`**; no business logic in controllers, repositories, or
  React components.

---

## 3. Coding Style

- **Formatting is automated** (Prettier). Never hand-format; never argue style in review.
- **Small, single-responsibility functions**; prefer early returns / guard clauses over deep nesting.
- **Immutability by default**: `const`, `readonly`, `as const`; avoid mutation where practical.
- **No magic numbers/strings** — name them as constants/enums in `@stockflow/config` or `@stockflow/types`.
- **Pure where possible**; isolate side effects; keep I/O at the edges.
- **Comments explain _why_, not _what_.** Keep them rare and meaningful. JSDoc on exported/public APIs.
- **Error handling**: throw typed domain errors; never swallow (`catch {}` is banned); handle at the
  edge (global filter on the API). See [.claude/backend/error-handling.md](../.claude/backend/error-handling.md).
- **Async**: `async/await` only; **no floating promises**; always handle rejection paths.
- **Logging**: structured Pino; **`console.*` is banned** in app code.

**Frontend specifics**
- React Server Components by default; `"use client"` only at the leaf that needs it.
- Components are small and presentational; **logic lives in hooks**; **server data lives in TanStack
  Query** (never mirrored into Zustand); forms use React Hook Form + Zod.
- No data-fetching or business logic inside components/JSX.

**Backend specifics**
- **Thin controllers** (validate → delegate → map); **logic in application/domain services**;
  **repositories do persistence only**. Depend on **ports (interfaces)**, wired by DI.

---

## 4. Import Rules

- **Import via a package's public entry** (`@stockflow/ui`), never deep paths
  (`../../../packages/ui/src/...`).
- **Within an app, use the path alias** (`@/feature/...`); no `../../../` climbs.
- **`import type`** for type-only imports.
- **Import order** (auto-fixed by ESLint), blank line between groups, alphabetized within a group:
  1. Node built-ins → 2. external deps → 3. internal packages (`@stockflow/*`) → 4. app aliases
  (`@/…`) → 5. relative (`./`, `../`).
- **No circular dependencies** (fails lint/CI).
- **No cross-boundary imports**: `apps` never import other `apps`; the `domain` layer never imports
  framework/infrastructure. See §10 and
  [.claude/architecture/dependency-rules.md](../.claude/architecture/dependency-rules.md).
- Side-effect imports allowed only for styles/polyfills.

---

## 5. TypeScript Rules

- **`strict: true`** plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `useUnknownInCatchVariables`. Shared via `@stockflow/tsconfig`.
- **Never `any`.** Use `unknown` + narrowing, precise types, or generics.
- **No `@ts-ignore`/`@ts-expect-error`** and **no non-null `!`** without a reviewed, commented reason (rare).
- **Prefer inference**; annotate public boundaries (exports, function signatures, DTOs) explicitly,
  including return types on exported functions.
- **Make illegal states unrepresentable**: discriminated unions over loose flags.
- **Model enums as string-literal unions / `as const` objects** in `@stockflow/types` — avoid
  numeric `enum`s. Enum *values* are lowercase strings.
- **Branded types for IDs** where mixing would be dangerous (`OrganizationId`, `VariantId`).
- **Validate at runtime boundaries with Zod, then `z.infer`** the static type — schema is the single
  source of truth (one schema serves DTO + form + job payload).
- Avoid loose `Function`, `Object`, `{}`; name generics descriptively when non-trivial.

---

## 6. Git Workflow

- **Trunk-based with short-lived branches.** `main` is always green and deployable; **protected** (no
  direct pushes).
- **Branch naming**: `<type>/<scope>-<short-desc>` → `feat/inventory-stock-ledger`,
  `fix/auth-session-expiry`. Types match commit types (§7).
- **Small, frequent commits**; **rebase** to keep a linear history; keep your branch current with
  `main` (rebase, resolve conflicts locally).
- **PR required** to merge; **squash-merge** so each PR is one logical commit on `main`.
- **Never force-push shared branches.** On your own branch, only `--force-with-lease`.
- **Releases are tagged** with semver; changelog via Changesets.

---

## 7. Commit Convention

**Conventional Commits**, enforced by commitlint (commit-msg hook + CI).
```
<type>(<scope>): <subject>

<body — what & why, wrapped ~72 cols>

<footer — BREAKING CHANGE: …, Closes #123>
```
- **types**: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **scope**: package/module (`api`, `web`, `ui`, `inventory`, `auth`, …).
- **subject**: imperative, lowercase, no trailing period, ≤ 72 chars.
- **body**: explain the why and any trade-offs. **footer**: breaking changes + issue refs.
- Commits are **atomic** (one logical change). Example:
  `feat(inventory): post adjustment movements transactionally`

---

## 8. Pull Requests

- **Small and focused** — one logical change; target ≤ ~400 changed lines where feasible.
- **PR title follows Conventional Commits** (it becomes the squash commit).
- **Description** states *what / why / how*, links the issue/story, includes screenshots for UI
  (light + dark), and lists testing done.
- **Docs and tests updated in the same PR** (documentation-first step 10).
- **CI must be green** (lint, typecheck, tests, build, security scan) before review.
- **Draft PRs** for work in progress; mark ready when complete.
- **Approvals**: ≥ 1 required (≥ 2 for security/auth/billing/infra changes), via CODEOWNERS.
- **No self-merge** of core changes.
- Full gate: [.claude/checklists/pull-request.md](../.claude/checklists/pull-request.md).

---

## 9. Code Reviews

**Reviewer checks, in priority order** (full list:
[.claude/quality/code-review.md](../.claude/quality/code-review.md)):
1. **Security** — tenant scope + permission checks, input validated, output allow-listed, no secrets.
2. **Correctness** — invariants, edge/error paths, transaction/ledger use.
3. **Architecture** — layering, module boundaries, dependency rules.
4. **Types** — no `any`/ignores; precise types; shared contracts updated.
5. **Tests** — adequate unit/integration/permission/tenant tests; regression for bugs.
6. **UI** — from `@stockflow/ui`; accessible; responsive; light/dark.
7. **Performance** — no N+1 / unbounded queries; indexes for new query patterns.
8. **Docs** — `docs/`, `.claude/`, Swagger, and permission catalog updated.

**Etiquette**
- Be kind and specific; review the code, not the person.
- Suggestions include rationale; prefix non-blocking comments with `nit:`.
- **Don't approve what you don't understand.** Author resolves every thread before merge.
- **Turnaround SLA**: review within one business day; unblock teammates first.

---

## 10. Dependency Rules

**Internal (architecture)**
- Source dependencies point **inward**: `presentation → application → domain`; `infrastructure`
  implements ports. **Domain imports no framework.**
- `apps → packages` only; **no `app → app`**; `types`/`utils` are leaves. **No cycles** (CI-enforced).

**External (third-party)**
- Adding a dependency requires a recorded decision (ADR in
  [.claude/architecture/design-decisions.md](../.claude/architecture/design-decisions.md)) covering:
  need, alternatives, maintenance health, security, bundle-size impact, and license.
- **Prefer the standard library / existing deps**; avoid trivial micro-packages.
- **Single version across the repo** (no duplicate majors); pin versions; internal deps use the
  workspace protocol.
- **License allow-list** enforced; **`npm audit` + Dependabot** in CI; no known critical vulns merge.
- Stay within the approved stack (see [.claude/CLAUDE.md §4](../.claude/CLAUDE.md)); additions are exceptions, not defaults.

---

## 11. Documentation Rules

- **Documentation-first**: a module's docs are written and **approved before implementation**
  (process step 1). No feature begins without approved docs.
- **Where docs live**: canonical specs in `docs/`; AI/operating rules in `.claude/`; a `README` per
  app/package; ADRs for decisions; **API docs auto-generated via Swagger**; **component docs in
  Storybook**.
- **Code-level**: JSDoc on exported/public APIs; comments explain *why*; keep code self-documenting.
- **Keep docs in sync** (process step 10): every PR updates the docs it affects. **Stale docs are
  treated as bugs.**
- **Changelog** entries via Changesets for user-facing or contract changes.
- Update the relevant `.claude/*` rule file when a convention changes — rules live where they're enforced.

---

## 12. Testing Rules

Full strategy: [.claude/quality/testing.md](../.claude/quality/testing.md).
- **Required test types**: unit, integration, e2e (critical journeys), validation (Zod/DTO),
  **permission** (RBAC), and **tenant-isolation** (adversarial).
- **Test behavior and invariants**, not implementation details.
- **Every bug fix adds a regression test.**
- **Deterministic**: no real time/network/randomness; seed via factories; AAA structure;
  test names state the expected behavior.
- **Inventory invariants are non-negotiable** in tests: `on-hand == Σ movements`,
  `available = on-hand − reserved ≥ 0`, transaction atomicity, idempotency.
- **No committed `.only`/skipped tests**; the full suite is a **CI merge gate**; coverage thresholds
  apply to core domains.
- Tests live beside source; integration tests use ephemeral Mongo/Redis.

---

## Enforcement summary

| Rule area | Automated by | Human (review) |
|-----------|--------------|----------------|
| Formatting | Prettier (pre-commit + CI) | — |
| Lint / imports / boundaries / a11y | ESLint (pre-commit + CI) | architecture judgment |
| Type safety | `tsc` (CI) | API/type design |
| Commits | commitlint (commit-msg + CI) | — |
| Tests & coverage | Turbo + CI gate | adequacy & meaning |
| Security & deps | `npm audit`, gitleaks, Dependabot | threat reasoning |
| Docs in sync | — | PR review + checklist |

## Definition of Done
A change is **done** when it is: typed (no `any`/ignores) · validated (input + output) · tenant-scoped
and permission-checked · tested (unit/integration + permission/tenant where relevant) · accessible
(UI) · documented (`docs`/`.claude`/Swagger/Storybook updated) · CI-green · reviewed and approved.

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Principal Architect / CTO | ☐ Approved ☐ Changes requested | |
