# Cloudinary

> **Status:** 🟡 Seed · **Owner:** Security Engineer · **Related:** [uploads](./uploads.md) · [tenant-isolation](./tenant-isolation.md)

## Purpose
Secure, organized media storage with a well-defined folder structure.

## Folder structure
```
inventory/
  organizations/<orgId>/
    products/ · categories/ · warehouses/
    purchase-orders/ · sales-orders/ · attachments/
    logos/ · avatars/ · users/
  temp/        # quarantine for fresh, unscanned uploads
```
- Every asset is foldered **per organization** for isolation and lifecycle management.

## Upload pipeline
1. Client requests a **signed upload** from the API (server holds the secret).
2. Validate type & size server-side; upload into `temp/` first (quarantine).
3. Process/transform (resize, format), then move to the final org folder on acceptance.
4. Store asset metadata (publicId, folder, tags, context, version) in `files`. See [database/collections](../database/collections.md).

## Rules
- Use **signed URLs**; never expose API secret to the client. See [secrets](./secrets.md).
- Set tags + context (orgId, entity, uploadedBy) for traceability.
- Support versioning, replacement, and deletion (and cascade cleanup when an entity is deleted).
- Optimize delivery via transformations (f_auto, q_auto, sized variants).
- Virus-scan architecture: scan from `temp/` before promotion (integration is roadmap). See [uploads](./uploads.md).
