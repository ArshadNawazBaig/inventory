# Backups & Disaster Recovery

> **Status:** 🟡 Seed · **Owner:** DevOps Engineer · **Related:** [railway](./railway.md) · [database/collections](../database/collections.md)

## Purpose
Never lose customer data; recover quickly from failure.

## What's backed up
- **MongoDB** (primary system of record) — automated, regular backups + point-in-time where available.
- **Cloudinary** assets (managed, versioned) — verify retention/restore path.
- Configuration/infra as code in the repo (`/infrastructure`).
- Redis is treated as ephemeral cache/queue (durable data lives in Mongo).

## Targets (set with stakeholders)
- **RPO** (max data loss): e.g., ≤ 24h (tighten with PITR).
- **RTO** (max downtime): e.g., ≤ 4h.

## Rules
- Backups are **encrypted** and access-controlled. See [security/encryption](../security/encryption.md).
- **Restores are tested** on a schedule — an untested backup is not a backup.
- Retention policy defined (daily/weekly/monthly) per compliance needs.
- Tenant data export available (GDPR) and tenant-scoped deletion supported.

## DR plan
- Documented runbook: detect → restore → validate → communicate.
- Periodic game-day drills; document recovery time achieved vs target.
