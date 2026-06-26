# API Versioning

> **Status:** 🟡 Seed · **Owner:** Backend Lead · **Related:** [standards](./standards.md)

## Purpose
Evolve the API without breaking existing clients.

## Strategy
- **URI versioning:** `/api/v1/...`. Start at `v1`.
- A new major version is introduced only for **breaking** changes; old version supported during a
  documented deprecation window.

## What's backward-compatible (no major bump)
- Adding endpoints, optional request fields, or new response fields.
- Adding new enum values *only* where clients are documented to tolerate unknowns.

## What's breaking (needs new version)
- Removing/renaming fields or endpoints, changing types/semantics, tightening validation,
  changing error codes or auth requirements.

## Rules
- Version the public REST surface; internal contracts evolve via `packages/types`.
- Document changes in a changelog; announce deprecations with timelines and `Deprecation`/`Sunset` headers.
- Webhooks are versioned alongside the API; payloads are additive where possible.
- Never silently change behavior within a version.
