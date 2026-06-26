# Prompt: Release

> **Status:** 🟡 Seed · **Owner:** Eng/DevOps · **Use:** preparing and shipping a release.

Drive a safe release following [devops/deployment](../devops/deployment.md) and the
[release checklist](../checklists/release.md).

## Steps
1. **Scope** — list changes since last release (features, fixes, breaking changes).
2. **Pre-flight** — CI green (lint/typecheck/tests), security scan clean, docs/Swagger updated,
   migrations backward-compatible & tested, feature flags set.
3. **Version** — bump semver; generate changelog; tag.
4. **Stage** — deploy to staging; run smoke + critical E2E; verify dashboards.
5. **Production** — approval-gated rolling deploy; run migrations (expand→migrate→contract).
6. **Verify** — health checks, Sentry error rate, latency, queue depth, key business metrics.
7. **Communicate** — release notes; notify stakeholders; update status.
8. **Rollback ready** — previous image + reverse migration on standby.

## Output
- Release notes (user-facing + technical).
- Confirmation each checklist item passed (or documented exception).
- Post-release monitoring summary (what to watch and for how long).

## Don't
- Don't ship with red CI, untested migrations, or unreviewed breaking changes.
