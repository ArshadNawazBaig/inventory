# GitHub Actions (CI/CD)

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [deployment](./deployment.md) · [docker](./docker.md) · [quality/testing](../quality/testing.md)

## Purpose
Automated, gated pipelines from commit to deploy.

## CI (on every PR)
1. Install (cached, frozen lockfile) — Turborepo remote cache if configured.
2. **Lint** + **typecheck** (all packages).
3. **Test**: unit + integration (with ephemeral Mongo/Redis services).
4. **Build** all apps.
5. **Security**: dependency audit + secret scan (gitleaks).
6. (Optional) E2E (Playwright) on key flows.

All steps must pass to merge. See [quality/eslint](../quality/eslint.md), [quality/testing](../quality/testing.md).

## CD (on merge to main / tag)
1. Build & push Docker images (per app), tagged by commit/semver.
2. Deploy to **staging** automatically; run smoke tests.
3. **Production** deploy gated by manual approval (and/or tag). See [deployment](./deployment.md).

## Rules
- Only affected packages rebuilt/tested where possible (Turborepo).
- Secrets via GitHub Actions encrypted secrets — never echoed in logs. See [security/secrets](../security/secrets.md).
- Required status checks + branch protection on `main`.
- Concurrency cancels superseded runs; deployments are not parallelized per environment.
