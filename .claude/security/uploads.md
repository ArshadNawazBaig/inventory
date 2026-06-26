# Uploads

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [cloudinary](./cloudinary.md) · [backend/validation](../backend/validation.md)

## Purpose
Handle file uploads safely (images, attachments, import files).

## Rules
- **Validate server-side**: allowed MIME types + extension + magic-byte sniffing (don't trust the
  client-declared type), and enforce a max size per upload type.
- Use **signed, server-issued** uploads; never embed storage secrets client-side.
- Upload into **`temp/` quarantine** first; promote to final folder only after validation/scan.
- Strip/normalize metadata (e.g., EXIF) from images where appropriate.
- Generate safe, unique storage keys; never use raw client filenames as paths.
- Enforce per-tenant quotas/limits; count toward plan usage where relevant.
- Import files (CSV/XLSX) are parsed in a **background job**, row-validated, with per-row error reporting.

## Virus-scan architecture (roadmap integration)
- Files sit in `temp/` as "pending"; a scan step marks them clean/infected.
- Infected → rejected + deleted + alert; clean → promoted to final folder and linked to its entity.

## Failure handling
- Reject with a clear, structured error; clean up partial/temp artifacts; never leave orphans.
