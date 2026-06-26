# Project Setup & Installation Plan

| Field | Value |
|-------|-------|
| **Document** | Project Setup / Installation Runbook (Phase P0) |
| **Status** | ✅ Executed — P0 workspace bootstrapped (install + build + typecheck + lint green) |
| **Owner** | DevOps / Principal Architect |
| **Date** | 2026-06-26 |
| **Related** | [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) · [ROADMAP.md](./ROADMAP.md) (P0) · [.claude/devops/](../.claude/devops/) |

> **Read me first.** This is a **plan**. No commands have been run, no packages installed, and no
> files created. It documents exactly *how* the monorepo will be bootstrapped so it can be reviewed
> and approved before any execution. Versions below are **indicative latest majors** as of the plan
> date — exact versions are pinned at install time with `pnpm add <pkg>@latest` and frozen in
> `pnpm-lock.yaml`.

---

## 1. Prerequisites (developer machine)

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | LTS (pinned in `.nvmrc`, e.g. 22.x) | Runtime; parity across machines + CI |
| **pnpm** | 9.x (via Corepack) | Workspace package manager |
| **Docker + Compose** | latest | Local MongoDB + Redis |
| **Git** | latest | Version control |

Enabled via `corepack enable` (no global pnpm install needed). No database installed locally —
Mongo/Redis run in Docker.

---

## 2. Installation order (high level)

The sequence matters — shared packages exist before the apps that import them.

1. Initialize repo & workspace (git, Corepack, root manifest, `pnpm-workspace.yaml`).
2. Root config & tooling files (turbo, tsconfig, eslint, prettier, husky, commitlint, changesets, env, ignores).
3. Shared **base** packages first: `tsconfig` → `eslint-config` → `config` → `types` → `utils`.
4. Shared **UI** packages: `icons` → `ui` (+ Storybook, shadcn/ui init, Tailwind v4).
5. `hooks` package.
6. Apps: `api` (Nest) → `worker` (Nest standalone) → `web` (Next.js).
7. Cross-cutting libs per app (auth, logging, monitoring, analytics, realtime, payments…).
8. Local infra (`docker-compose` for Mongo/Redis) + `.env` wiring.
9. Verify: `pnpm install` → `turbo run typecheck lint build`.
10. CI workflow + Railway environments.

> Apps `api`/`worker`/`web` are scaffolded with their official generators
> (`nest new`, `create-next-app`) **into the workspace**, then trimmed to our
> [folder structure](./REPOSITORY_STRUCTURE.md) and pointed at the shared configs.

---

## 3. Authoritative dependency manifest

Grouped by workspace. `workspace:*` = internal package reference (no version). Dev-only deps marked **(dev)**.

### Root (repo tooling — `package.json` is private, dev deps only)
| Package | Ver | Purpose |
|---------|-----|---------|
| `turbo` | ^2 | Task pipeline + caching **(dev)** |
| `typescript` | ^5.7 | Compiler **(dev)** |
| `prettier` | ^3 | Formatting **(dev)** |
| `eslint` | ^9 (flat config) | Linting **(dev)** |
| `husky` | ^9 | Git hooks **(dev)** |
| `lint-staged` | ^15 | Pre-commit runner **(dev)** |
| `@commitlint/cli` + `@commitlint/config-conventional` | ^19 | Commit message linting **(dev)** |
| `@changesets/cli` | ^2 | Versioning & changelogs **(dev)** |

> Secret scanning (**gitleaks**) and license checks run in CI as actions, not npm deps.

### `packages/tsconfig`
No runtime deps — ships base JSON configs (`base.json`, `nextjs.json`, `nestjs.json`, `react-library.json`).

### `packages/eslint-config` (dev tooling lib)
| Package | Ver | Purpose |
|---------|-----|---------|
| `typescript-eslint` | ^8 | TS-aware linting |
| `eslint-plugin-import` / `eslint-import-resolver-typescript` | latest | Import order + boundaries |
| `eslint-plugin-react` / `eslint-plugin-react-hooks` | latest | React rules |
| `eslint-plugin-jsx-a11y` | latest | Accessibility lint |
| `eslint-config-prettier` | latest | Disable stylistic conflicts |
| `eslint-plugin-boundaries` *(recommended)* | latest | Enforce layer/dependency rules |

### `packages/config`
| Package | Ver | Purpose |
|---------|-----|---------|
| `zod` | ^3 (pin; eval Zod 4) | Env-var schema + shared constants validation |

### `packages/types`
| Package | Ver | Purpose |
|---------|-----|---------|
| `zod` | ^3 | Source-of-truth schemas → `z.infer` types (shared DTO/form/job contracts) |

### `packages/utils`
| Package | Ver | Purpose |
|---------|-----|---------|
| `date-fns` *(if needed)* | ^4 | Date/UTC helpers (kept minimal; leaf package) |

### `packages/icons`
| Package | Ver | Purpose |
|---------|-----|---------|
| `lucide-react` | latest | Base icon set, re-exported as typed components |
| `react` (peer) | ^19 | Peer dependency |

### `packages/ui` (design system)
| Package | Ver | Purpose |
|---------|-----|---------|
| `react` / `react-dom` (peer) | ^19 | Peers |
| `@radix-ui/react-*` | latest | Accessible primitives (added per component via shadcn/ui) |
| `class-variance-authority` | latest | Variant API |
| `tailwind-merge` + `clsx` | latest | Class composition |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | Styling engine (CSS-first v4) |
| `motion` (Framer Motion) | ^12 | Animations (`motion/react`) |
| `recharts` | ^2 (eval ^3) | Chart primitives wrapped by `ui` chart components |
| `storybook` + `@storybook/*` + `@storybook/addon-a11y` | ^8 | Component docs/testing **(dev)** |

> **shadcn/ui** is **not a dependency** — it's a CLI (`pnpm dlx shadcn@latest init/add`) that
> generates component source into `packages/ui` and pulls the Radix/cva/tailwind-merge pieces above.

### `packages/hooks`
| Package | Ver | Purpose |
|---------|-----|---------|
| `react` (peer) | ^19 | Peer |

### `apps/web` (Next.js)
| Package | Ver | Purpose |
|---------|-----|---------|
| `next` | latest (15/16) | Framework |
| `react` / `react-dom` | ^19 | UI runtime |
| `@tanstack/react-query` | ^5 | Server-state |
| `@tanstack/react-table` | ^8 | Tables |
| `zustand` | ^5 | Global client UI state |
| `react-hook-form` + `@hookform/resolvers` | ^7 | Forms |
| `zod` | ^3 | Validation (shared schemas) |
| `motion` | ^12 | Animation |
| `recharts` | ^2 | Charts (via `@stockflow/ui`) |
| `better-auth` | latest | Auth client |
| `socket.io-client` | ^4 | Realtime updates (stock, notifications) |
| `@sentry/nextjs` | latest (^8/^9) | Error monitoring |
| `posthog-js` | latest | Product analytics |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | Styling |
| `@stockflow/ui`,`/types`,`/utils`,`/hooks`,`/icons`,`/config` | workspace:* | Internal |

### `apps/api` (NestJS)
| Package | Ver | Purpose |
|---------|-----|---------|
| `@nestjs/common`,`/core`,`/platform-express` | ^11 | Framework |
| `@nestjs/config` | ^3 | Config module (wraps `@stockflow/config` schema) |
| `@nestjs/mongoose` + `mongoose` | ^11 / ^8 | MongoDB ODM |
| `@nestjs/bullmq` + `bullmq` | latest / ^5 | Queues (producer side) |
| `ioredis` | ^5 | Redis client |
| `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` | ^11 / ^4 | Realtime gateways |
| `@nestjs/swagger` + `swagger-ui-express` | ^11 | OpenAPI docs |
| `better-auth` | latest | Authentication |
| `nestjs-zod` *(or zod pipe)* + `zod` | latest / ^3 | DTO validation from shared schemas |
| `cloudinary` | ^2 | Media storage |
| `resend` | ^4 | Transactional email |
| `stripe` | latest (^17/^18) | Billing/webhooks |
| `nestjs-pino` + `pino` + `pino-http` | ^4 / ^9 | Structured logging |
| `@sentry/nestjs` (or `@sentry/node`) | latest | Error monitoring |
| `posthog-node` | latest | Server analytics |
| `helmet` | ^8 | Secure headers |
| `@nestjs/throttler` | ^6 | Rate limiting |
| `@stockflow/types`,`/utils`,`/config` | workspace:* | Internal |

### `apps/worker` (NestJS standalone)
| Package | Ver | Purpose |
|---------|-----|---------|
| `@nestjs/common`,`/core` | ^11 | Standalone app context |
| `bullmq` + `ioredis` | ^5 | Queue consumers |
| `@nestjs/mongoose` + `mongoose` | ^11 / ^8 | DB access for jobs |
| `socket.io` *(client/emitter)* | ^4 | Emit realtime events (via Redis adapter) |
| `resend` | ^4 | Email jobs |
| `cloudinary` | ^2 | Media processing jobs |
| `nestjs-pino` + `pino` | ^4 / ^9 | Logging |
| `@sentry/node` | latest | Monitoring |
| `posthog-node` | latest | Analytics events |
| `zod` | ^3 | Job payload validation |
| `@stockflow/types`,`/utils`,`/config` | workspace:* | Internal |

> **Realtime note (Socket.IO):** the API hosts the gateway; the worker emits events. With multiple
> instances we use the **Socket.IO Redis adapter** (`@socket.io/redis-adapter`) so events fan out
> across processes. Auth on the socket handshake reuses Better Auth + tenant context.

### Testing (added across apps/packages — **dev**)
| Package | Ver | Purpose |
|---------|-----|---------|
| `vitest` *(or `jest`)* | ^2 | Unit tests |
| `@testing-library/react` + `/jest-dom` | latest | Component tests |
| `mongodb-memory-server` *(or `testcontainers`)* | latest | Integration DB |
| `@playwright/test` | ^1 | E2E |
| `supertest` | ^7 | API integration |

---

## 4. Config files that will be created (not yet written)

Mapped to [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md). **None created in this step.**

**Root:** `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (generated), `turbo.json`,
`tsconfig.json`, `.npmrc`, `.nvmrc`, `.editorconfig`, `.gitignore`, `.dockerignore`, `.env.example`,
`prettier.config.mjs`, `eslint.config.mjs` (flat, re-exports `@stockflow/eslint-config`),
`commitlint.config.mjs`, `.husky/{pre-commit,commit-msg}`, `.changeset/config.json`, `README.md`, `LICENSE`.

**Per package:** `package.json`, `tsconfig.json` (extends `@stockflow/tsconfig/*`), `src/index.ts`
barrel; `packages/ui` also `.storybook/`, `components.json` (shadcn), Tailwind theme entry.

**Per app:** `package.json`, `tsconfig.json`, `Dockerfile`, framework config
(`next.config.ts` / Nest `nest-cli.json`), and `src/` skeleton per the folder structure
(no business logic — bootstrap + module wiring only, added in P3+).

**Infra:** `infrastructure/docker/docker-compose.yml` (Mongo + Redis for local dev).

**CI:** `.github/workflows/ci.yml`, `.github/CODEOWNERS`, `.github/dependabot.yml`, PR/issue templates.

---

## 5. `turbo.json` pipeline (planned shape)

Tasks and their dependency wiring (described, not written):

| Task | `dependsOn` | Cached outputs |
|------|-------------|----------------|
| `build` | `^build` (deps first) | `dist/**`, `.next/**` |
| `dev` | — (persistent, not cached) | — |
| `lint` | `^build` (for types) | — |
| `typecheck` | `^build` | — |
| `test` | `^build` | coverage |
| `test:e2e` | `build` | reports |
| `clean` | — | — |

Remote caching enabled later (P0.M0.3) to share results between devs and CI.

---

## 6. Environment variables (documented in `.env.example`, values never committed)

`MONGODB_URI`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`CLOUDINARY_CLOUD_NAME`/`_API_KEY`/`_API_SECRET`, `STRIPE_SECRET_KEY`/`_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `SENTRY_DSN`, `POSTHOG_KEY`/`_HOST`, `APP_URL`, `API_URL`,
plus public `NEXT_PUBLIC_APP_URL`/`_API_URL`/`_POSTHOG_KEY`/`_SENTRY_DSN`.
Loaded and **validated at boot** via the `@stockflow/config` Zod schema (fail-fast). See
[.claude/devops/environments.md](../.claude/devops/environments.md) and
[.claude/security/secrets.md](../.claude/security/secrets.md).

---

## 7. Verification (definition of done for P0 bootstrap)

After execution (a later, approved step), success means:
- `pnpm install` completes from a clean checkout with a committed lockfile.
- `turbo run typecheck lint build` passes across all workspaces.
- `docker compose up` brings up Mongo + Redis; apps connect.
- A trivial health route on `api`/`worker` and a placeholder page on `web` run locally.
- CI runs the same tasks and is green; staging deploy succeeds.

---

## 8. Execution checklist (commands — to run only after approval)

> Listed for review; **not executed now.**
```
corepack enable
git init
pnpm init                          # root manifest (then mark private, add workspaces)
# create pnpm-workspace.yaml, turbo.json, shared configs
pnpm add -Dw turbo typescript prettier eslint husky lint-staged @commitlint/cli @changesets/cli
# scaffold shared packages (tsconfig, eslint-config, config, types, utils, icons, ui, hooks)
pnpm dlx shadcn@latest init        # inside packages/ui
nest new api --skip-git            # then relocate into apps/api & wire shared configs
nest new worker --skip-git
pnpm dlx create-next-app@latest web
# install per-app deps per §3
pnpm install
turbo run typecheck lint build
```

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Principal Architect / DevOps / CTO | ☐ Approved ☐ Changes requested | |

> On approval, this becomes **Phase P0 — Foundations** execution (scaffold configs → install → CI).
