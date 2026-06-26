# Toast — Component Spec

| Field | Value |
|-------|-------|
| **Component** | `Toaster` + `toast()` (`@stockflow/ui` → `primitives/toast`) |
| **Status** | ✅ Implemented — Radix Toast + imperative store + tests + stories (Batch 7 · feedback) |
| **Owner** | Frontend Lead / UI Engineer |
| **Date** | 2026-06-27 |
| **Depends on** | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · `@radix-ui/react-toast` · `@stockflow/icons` |

> **Architecture decision:** two layers. The **accessible primitive** is a token-skin over
> `@radix-ui/react-toast` — it gives us the `role="region"` viewport (with the F8 focus hotkey), per-toast
> live-region semantics, an **auto-dismiss timer that pauses on hover/focus and window blur**, and
> **swipe-to-dismiss** — none of which we want to re-implement. On top we add an **imperative API**: a tiny
> framework-free store (subscribed via `useSyncExternalStore` — no Zustand dependency in the library) and a
> callable `toast()` with `toast.success/error/warning/info` + `toast.dismiss`. You mount **one**
> `<Toaster />` at the app root; anywhere else you just call `toast.success('Saved')`. Tone is conveyed by a
> coloured icon **and** a left accent bar (never colour alone); surfaces stay neutral (`popover`) so text
> keeps AA contrast in both themes. Dismissal is animated (controlled `open` + delayed store removal so the
> exit animation plays).

---

## 1. Overview

Transient, non-blocking feedback — "Product saved", "Import failed". Stacked bottom-right by default,
auto-dismissing, swipeable, and announced to screen readers. Driven imperatively from event handlers,
mutations (TanStack Query `onSuccess`/`onError`), and background events.

---

## 2. API

```ts
// Mount once (app root)
<Toaster position="bottom-right" duration={5000} />

// Call anywhere
toast(title, options?)            // tone: 'default'
toast.success(title, options?)
toast.error(title, options?)
toast.warning(title, options?)
toast.info(title, options?)
toast.dismiss(id?)                // dismiss one, or all
// each returns the toast id (string)

interface ToastOptions {
  description?: ReactNode;
  duration?: number;              // ms; Infinity = sticky
  action?: { label: string; onClick: () => void; altText?: string };
  tone?: ToastTone;               // base toast() only
  id?: string;                    // supply to dedupe/replace
}
type ToastTone = 'default' | 'success' | 'error' | 'warning' | 'info';

// Also exported (declarative / advanced): ToastProvider, ToastViewport, Toast,
// ToastTitle, ToastDescription, ToastClose, ToastAction
```

---

## 3. Behavior

- **Imperative:** `toast.*` pushes onto a module store; the mounted `<Toaster />` renders the queue. A
  **limit** (5) drops the oldest when exceeded.
- **Auto-dismiss:** after `duration` (default 5 s). Radix **pauses** the timer on hover, focus, and window
  blur, and resumes after. `duration: Infinity` keeps it until dismissed.
- **Dismiss:** the close (✕) button, swipe (right), `toast.dismiss(id)`, or auto. Dismissal sets `open`
  false (exit animation) then removes from the store after the animation.
- **Action:** an optional button (e.g. "Undo"); Radix requires `altText` for the screen-reader alternative.
- **Tone:** coloured leading icon (success/error/warning/info) + left accent bar; `default` has no icon.

---

## 4. Accessibility (acceptance criteria)

- The viewport is a labelled `role="region"` reachable via the **F8** hotkey; each toast uses Radix's live
  semantics (errors announced assertively, others politely) so content is read without stealing focus.
- Tone is never colour-only (icon + text + accent); the close button has an accessible name; actions expose
  `altText`; focus-visible rings on interactive controls; AA contrast both themes; honours reduced-motion
  (global base layer).

---

## 5. Testing (plan)

- **Imperative render:** `toast.success('Saved')` shows the toast in the region.
- **Title + description:** both render.
- **Close:** the ✕ button dismisses it.
- **Action:** the action button fires `onClick` (and is labelled).
- **Programmatic dismiss:** `toast.dismiss(id)` removes that toast.
- **Stacking:** multiple calls render multiple toasts.
- **A11y:** `axe` passes with a toast open.

---

## 6. Documentation (deliverables)

- **Storybook:** tones (default/success/error/warning/info) · with description · with action · sticky ·
  stacked; light + dark; triggered from buttons.
- **MDX do/don't:** mount one `<Toaster />`; use for transient confirmations not critical errors that need
  acknowledgement (use a Dialog); keep messages short; prefer `toast.promise`-style flows via mutation
  callbacks; don't toast on every keystroke.

---

## 7. Definition of Done

Typed (no `any`) · Radix Toast skin (region, live, auto-dismiss pause, swipe) · imperative `toast()` store
(no Zustand dep) · tones via icon + accent (not colour alone) · action + sticky + dedupe id · animated
dismissal · accessible (region/F8, live, labelled controls, axe) · token-only styling · Storybook · unit +
a11y tests. (Per [COMPONENT_LIBRARY.md](../COMPONENT_LIBRARY.md) §6.)

---

## Approval
| Role | Decision | Date |
|------|----------|------|
| Frontend Lead / CTO | ☐ Approved ☐ Changes requested | |
