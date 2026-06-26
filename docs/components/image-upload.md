# Image Upload — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `ImageUpload` (`@stockflow/ui` → `primitives/image-upload`) |
| **Status** | ✅ Implemented — dropzone + thumbnail previews + tests + stories (Batch 6 · rich inputs) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [File Upload](./file-upload.md) (`useFileUpload` hook) · [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `@stockflow/icons` |

> **Architecture decision:** Image Upload is the **visual sibling** of [File Upload](./file-upload.md):
> identical selection/validation/drag behavior, different presentation. To honour DRY we extracted that
> behavior into a headless **`useFileUpload`** hook (controlled/uncontrolled list, type/size/count
> validation, typed rejections, drag-depth tracking, add/remove) that both components consume. Image
> Upload renders **thumbnail previews** instead of a file list: a **gallery grid** (multiple) with an
> "add" tile, or a single **avatar/cover** preview (`shape="circle"` for avatars). Previews use
> `URL.createObjectURL` with a **StrictMode-safe lifecycle** — created and revoked inside an effect keyed
> on the set of image ids, so URLs are released on removal and unmount with no leaks. `accept` defaults to
> `image/*`. Like File Upload it is **transport-agnostic** — the parent uploads (eventually **Cloudinary**)
> and writes back `status`/`progress`/`error`. Cropping is out of scope (future).

---

## 1. Overview

A drag-and-drop image picker with live thumbnail previews — a product-image gallery or a single
avatar/logo/cover field. Validates type/size/count up front, shows per-image upload status as an overlay,
and themes light/dark with tokens.

---

## 2. API

```ts
ImageUpload
  // selection (shared with FileUpload via useFileUpload)
  value? / defaultValue?: UploadFile[]
  onChange?: (files: UploadFile[]) => void
  onReject?: (rejections: FileRejection[]) => void
  onRemove?: (file: UploadFile) => void
  accept?: string = 'image/*'
  multiple?: boolean = true
  maxFiles? / maxSize? / minSize?: number
  disabled? / invalid?: boolean
  // image-specific
  shape?: 'rectangle' | 'circle' = 'rectangle'   // circle ⇒ avatar
  label? / description?: ReactNode
  className?: string
  'aria-label'?: string

// Models & helper re-used from File Upload
UploadFile, UploadStatus, FileRejection, FileRejectionCode, formatBytes, useFileUpload
```

---

## 3. Behavior

- **Layouts:** `multiple` → a responsive **thumbnail grid** with a dashed **add tile** (hidden once
  `maxFiles` is reached); single → one preview box (the whole box is the dropzone; drop/click replaces).
- **Previews:** each image renders a thumbnail via an object URL, created/revoked in an effect keyed on the
  image id set (StrictMode-safe, no leaks). Non-image files (if `accept` is widened) fall back to an icon.
- **Validation & drag:** same as File Upload (`accept` default `image/*`, `maxSize`/`minSize`, `maxFiles`);
  rejected files surface inline (`role="alert"`) and via `onReject`. The drop target is the whole gallery.
- **Status overlay:** `uploading` dims the tile with a spinner + percent; `error` tints it and shows the
  message; `success` is clean.
- **Remove:** an ✕ on each tile (or the single preview) removes it and revokes its object URL.

---

## 4. Accessibility (acceptance criteria)

- Browsing uses a focusable `<input type="file">` inside a `<label>` (add tile / single box), operable by
  keyboard; focus shown via `focus-within` ring; the input carries an accessible name.
- Each preview has meaningful `alt` (the file name); each remove button has an explicit `aria-label`
  ("Remove <name>"); uploading uses `role="progressbar"`; errors use `role="alert"`. Drag state is conveyed
  by border/text, not colour alone. AA contrast both themes.

---

## 5. Testing (plan)

- **Browse/drop:** adding an image shows a thumbnail (`alt` = name) and calls `onChange`.
- **Validation:** a non-image (default `accept="image/*"`) and an over-`maxSize` file are rejected and
  reported with the right code.
- **maxFiles:** the add tile disappears at the cap; extra files are rejected `too-many-files`.
- **Single:** a second selection replaces the first; `shape="circle"` renders the circular preview.
- **Remove:** removing a tile drops it and calls `URL.revokeObjectURL`.
- **Status:** an `uploading` item renders a progressbar; an `error` item renders its message.
- **A11y:** `axe` passes (empty and with images).

---

## 6. Documentation (deliverables)

- **Storybook:** empty gallery · with images · single avatar (circle) · restricted (accept+maxSize) ·
  uploading/error states · disabled; light + dark.
- **MDX do/don't:** default `accept="image/*"`; use `shape="circle"` + `multiple={false}` for avatars;
  validate up front; keep `value` controlled to show progress; never trust client checks — validate and
  transform server-side / via Cloudinary before persisting.

---

## 7. Definition of Done

Typed (no `any`) · shares `useFileUpload` (no duplicated logic) · thumbnail previews with StrictMode-safe
object-URL lifecycle · gallery + single/avatar (`shape`) · client validation with typed rejections ·
status overlays · controlled + uncontrolled · accessible (labelled input, alt text, progressbar, alerts,
axe) · token-only styling · Storybook · unit + a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
