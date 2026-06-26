# Notification — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Notification` (`@stockflow/ui` → `primitives/notification`) |
| **Status** | ✅ Implemented — inline alert banner + tests + stories (Batch 7 · feedback) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · [Toast](./toast.md) (sibling) · `@stockflow/icons` |

> **Architecture decision:** Notification is the **persistent, in-page** counterpart to [Toast](./toast.md)
> (which is transient and floats). It's a presentational **alert banner** — a tone-coloured box with an
> icon, title, body, optional actions, and an optional dismiss — for contextual messages that live in the
> layout ("3 SKUs below reorder point", a form-level error summary, a maintenance notice). Tone
> (`info`/`success`/`warning`/`error`/`neutral`) × appearance (`soft`/`outline`/`solid`) is a cva matrix on
> design tokens, so every combination themes light/dark with AA contrast; tone is conveyed by a **coloured
> icon + text**, never colour alone. It's prop-driven (not composition) because notifications are
> uniform — title/body/action/dismiss. Visibility is **consumer-owned** (`onDismiss` is a callback); for
> auto-dismissing popups use Toast, and a future notification **center** (bell + panel) will compose these
> items inside a Popover with a Badge count.

---

## 1. Overview

A contextual, persistent message block. Use it for page- or section-level state the user should notice but
that doesn't block them: warnings, confirmations, inline error summaries, and informational notices.

---

## 2. API

```ts
Notification
  tone?: 'info' | 'success' | 'warning' | 'error' | 'neutral'  = 'info'
  appearance?: 'soft' | 'outline' | 'solid'                    = 'soft'
  title?: ReactNode
  children?: ReactNode            // the body / description
  icon?: LucideIcon | null        // override the tone icon; null hides it
  action?: ReactNode              // buttons/links row under the body
  onDismiss?: () => void          // shows a ✕ when provided (visibility is the caller's)
  dismissLabel?: string           // a11y name for the ✕ (default "Dismiss")
  role?: string                   // default: error/warning → "alert", else "status"
  // …div props
```

---

## 3. Behavior

- **Tone × appearance:** `soft` (tinted surface, default), `outline` (neutral surface + tone border),
  `solid` (filled tone surface with its `-foreground` text). The leading icon defaults from the tone
  (info/success/warning/error); `neutral` has none; pass `icon` to override or `icon={null}` to hide.
- **Actions:** render buttons/links via `action` (a row beneath the body) — e.g. "Reorder", "View".
- **Dismiss:** when `onDismiss` is set, a ✕ appears top-right; the caller removes/hides the banner
  (controlled — no internal open state). Omit it for non-dismissible notices.
- **Live semantics:** defaults to `role="alert"` for error/warning (assertive) and `role="status"`
  otherwise; override via `role`.

---

## 4. Accessibility (acceptance criteria)

- Conveys tone with icon + text, not colour alone; AA contrast for every tone × appearance in both themes
  (notably `solid` uses each tone's `-foreground` token).
- Appropriate live role (`alert`/`status`) so dynamically-shown notifications are announced without stealing
  focus; the dismiss button has an accessible name and a focus-visible ring; decorative icons are
  `aria-hidden`.

---

## 5. Testing (plan)

- **Structure:** renders title + body; shows the tone icon; `icon={null}` hides it.
- **Tone role:** `error` exposes `role="alert"`; `info` exposes `role="status"`.
- **Dismiss:** the ✕ shows only with `onDismiss` and fires it on click.
- **Action:** the action node renders.
- **Appearance:** `solid` applies the filled tone surface (token class present).
- **A11y:** `axe` passes (soft and solid).

---

## 6. Documentation (deliverables)

- **Storybook:** tones (soft) · appearances (soft/outline/solid) · with action · dismissible · title-only ·
  body-only · custom icon; light + dark.
- **MDX do/don't:** use for persistent contextual messages (Toast for transient); keep one primary action;
  pick tone by severity; don't stack many notifications — summarise; use `solid` sparingly for high-urgency
  notices only.

---

## 7. Definition of Done

Typed (no `any`) · tone × appearance cva on tokens (AA both themes) · tone icon + override/hide · action +
dismiss (controlled) · correct live roles · accessible (role, labelled dismiss, focus ring, axe) ·
token-only styling · Storybook · unit + a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
