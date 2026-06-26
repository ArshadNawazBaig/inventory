# StockFlow

Modern, multi-tenant **Inventory Management SaaS** — enterprise-grade correctness with
consumer-grade UX. Turborepo monorepo (Next.js client + NestJS API/worker).

## Quick start

```bash
corepack enable          # use the pinned pnpm
pnpm install             # install the workspace
cp .env.example .env     # then fill in values

# local datastores (MongoDB + Redis)
docker compose -f infrastructure/docker/docker-compose.yml up -d

pnpm build               # build everything (Turbo, dependency-ordered)
pnpm dev                 # run all apps in watch mode
```

## Workspace

| Path | What |
|------|------|
| `apps/web` | Next.js frontend (client) |
| `apps/api` | NestJS REST API + Swagger + realtime (server) |
| `apps/worker` | NestJS BullMQ background worker (server) |
| `packages/ui` | Design system (the only source of UI) |
| `packages/icons` · `hooks` · `types` · `utils` · `config` | Shared libraries |
| `packages/eslint-config` · `tsconfig` | Shared tooling configs |

## Commands

| Command | Description |
|---------|-------------|
| **`pnpm dev`** | **Run client + server together** (web :3000, api :3001, worker) — single command |
| `pnpm dev:web` | Run only the client (web) |
| `pnpm dev:api` | Run only the API server |
| `pnpm dev:server` | Run the server side (api + worker) |
| `pnpm build` | Build all packages & apps |
| `pnpm lint` | Lint the workspace |
| `pnpm typecheck` | Type-check the workspace |
| `pnpm test` | Run tests |
| `pnpm format` | Format with Prettier |

> `pnpm dev` builds the shared packages first (Turbo `^build`), then starts every app in
> watch mode concurrently — so one command runs the whole stack from a clean checkout.

## Documentation

See [`docs/`](./docs/README.md) (PRD, architecture, roadmap, standards, setup) and
[`.claude/`](./.claude/CLAUDE.md) (engineering rules / AI knowledge base).
