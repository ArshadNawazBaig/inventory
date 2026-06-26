# Checklist: Release

> **Status:** 🟡 Seed · **Owner:** Eng/DevOps · **Related:** [prompts/release](../prompts/release.md) · [checklists/deployment](./deployment.md)

## Scope & readiness
- [ ] Change log compiled (features, fixes, **breaking changes** called out).
- [ ] Breaking API changes versioned + deprecation/sunset communicated. See [api/versioning](../api/versioning.md).
- [ ] All linked stories meet acceptance criteria; QA signed off.
- [ ] Security review done for sensitive changes. See [checklists/security](./security.md).

## Versioning & docs
- [ ] Semver bumped; git tag created.
- [ ] Release notes (user-facing + technical) drafted.
- [ ] Docs/Swagger/`.claude` updated and indexed.

## Ship
- [ ] Deployment checklist completed (staging → prod). See [checklists/deployment](./deployment.md).
- [ ] Migrations applied; feature flags flipped per plan.

## Verify & communicate
- [ ] Post-release monitoring window observed (errors/latency/queues/business KPIs).
- [ ] Stakeholders + customers notified as appropriate.
- [ ] Rollback path confirmed available throughout.

## Retro (optional but encouraged)
- [ ] What went well / what to improve captured for next release.
