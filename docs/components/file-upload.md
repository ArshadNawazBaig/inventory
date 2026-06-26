# File Upload — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `FileUpload` (`@stockflow/ui` → `primitives/file-upload`) |
| **Status** | ✅ Implemented — native dropzone + file list + tests + stories (Batch 6 · rich inputs) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [Input](./input.md) (field tokens) · `@stockflow/icons` |

> **Architecture decision:** built **hand-rolled on native APIs** — a `<label>`-wrapped
> `<input type="file">` for accessible click/keyboard browsing plus drag-and-drop via the native
> `dragenter`/`dragover`/`drop` events. We deliberately **do not** add `react-dropzone` (not in the
> approved stack; the native surface is small). The component owns selection, **client-side validation**
> (type via `accept`, `min`/`maxSize`, `maxFiles`), and the selected-file **list UI** with per-file
> status/progress — but it is transport-agnostic: it never uploads. The parent drives the actual upload
> (eventually **Cloudinary**, signed/direct) and feeds back `status`/`progress`/`error` per file. Image
> thumbnails/crop are out of scope here — that's the sibling **Image Upload**. Controlled or uncontrolled;
> value is `UploadFile[]` (a `File` plus id + upload lifecycle) so the same list backs both selection and
> upload state.

---

## 1. Overview

A drag-and-drop dropzone (also click/keyboard to browse) that collects files, validates them up front,
and renders a removable list with name, size, and upload status. Used for CSV/Excel imports, supplier
documents, and product attachments. Themed entirely with design tokens (light/dark).

---

## 2. API

```ts
FileUpload
  value? / defaultValue?: UploadFile[]          // controlled / uncontrolled list
  onChange?: (files: UploadFile[]) => void      // accepted list after add/remove
  onReject?: (rejections: FileRejection[]) => void
  onRemove?: (file: UploadFile) => void

  accept?: string            // HTML accept, e.g. "image/*,.pdf,.csv"
  multiple?: boolean = true
  maxFiles?: number          // cap (multiple only)
  maxSize? / minSize?: number  // bytes
  disabled?: boolean
  invalid?: boolean          // error skin (e.g. form-level required)

  label?: ReactNode          // dropzone primary line
  description?: ReactNode     // dropzone hint line (defaults from accept/size)
  className?: string
  'aria-label'?: string      // accessible name for the input (default "Upload files")

// Models
UploadFile      = { id: string; file: File; status?: UploadStatus; progress?: number; error?: string }
UploadStatus    = 'pending' | 'uploading' | 'success' | 'error'
FileRejection   = { file: File; errors: { code: FileRejectionCode; message: string }[] }
FileRejectionCode = 'file-too-large' | 'file-too-small' | 'file-invalid-type' | 'too-many-files'

// Helper
formatBytes(bytes: number): string
```

---

## 3. Behavior

- **Add:** drop files on the zone or browse (click / keyboard). Each file is validated; accepted files are
  appended (`multiple`) or replace the current one (single). `pending` is the default status.
- **Validate:** `accept` (extension `.csv` / wildcard `image/*` / exact `application/pdf`), `maxSize`/
  `minSize`, and `maxFiles`. Rejected files are **not** added; they surface inline under the zone and via
  `onReject`. The native `<input accept>` is also set so the OS dialog pre-filters.
- **Drag affordance:** the zone highlights (primary border/tint) while dragging; a depth counter prevents
  flicker as the pointer crosses child elements.
- **List:** each row shows a file icon, name, size (`formatBytes`), a remove button, and — when the parent
  sets it — an uploading **progress bar**, a success check, or an error message.
- **Remove:** the ✕ on a row removes it (updates the value, fires `onRemove`).
- **Disabled:** no browse, no drop, muted styling.
- **Upload is the parent's job:** read `onChange`, upload (Cloudinary), and write back `status`/`progress`/
  `error` on a controlled `value`.

---

## 4. Accessibility (acceptance criteria)

- The dropzone is a real `<label>` wrapping a focusable `<input type="file">` (sr-only, not `display:none`),
  so it is reachable by Tab and operable with Enter/Space; the input carries an accessible name.
- Focus is shown on the zone via `focus-within` ring; drag state is conveyed by text/border, not colour
  alone. Each remove button has an explicit `aria-label` ("Remove <name>").
- Progress uses `role="progressbar"` with `aria-valuenow/min/max`; rejection messages are associated with
  the input via `aria-describedby` and announced (`role="alert"`). AA contrast in both themes.

---

## 5. Testing (plan)

- **Browse:** selecting files via the input adds them and calls `onChange`.
- **Drop:** a `drop` with `dataTransfer.files` adds files.
- **Validation:** an over-`maxSize` file and a wrong-`accept` file are rejected (not added) and reported to
  `onReject` with the right code.
- **maxFiles:** extra files beyond the cap are rejected `too-many-files`.
- **Single mode:** a second selection replaces the first.
- **Remove:** the row's remove button drops the file and fires `onRemove`.
- **Disabled:** input is disabled; drop does nothing.
- **Status UI:** an `uploading` item renders a progressbar; an `error` item renders its message.
- **A11y:** `axe` passes (empty and with files).

---

## 6. Documentation (deliverables)

- **Storybook:** empty · with files · single · restricted (accept + maxSize) · uploading/success/error
  states · disabled; light + dark.
- **MDX do/don't:** validate with `accept`/`maxSize` not after the fact; keep `value` controlled to show
  upload progress; for avatars/product images use Image Upload; never trust client validation — re-check
  server-side (size/type/scan) before persisting to Cloudinary.

---

## 7. Definition of Done

Typed (no `any`) · native dropzone + `<input type="file">` (no `react-dropzone`) · drag-drop + click +
keyboard · client validation (type/size/count) with typed rejections · removable list with status/progress ·
controlled + uncontrolled · accessible (focusable label, progressbar, alerts, axe) · token-only styling ·
Storybook · unit + a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
