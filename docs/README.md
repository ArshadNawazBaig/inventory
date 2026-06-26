# StockFlow — Documentation

Modern Inventory Management SaaS — enterprise-grade correctness with consumer-grade UX.

This repository follows a **documentation-first** delivery process. No feature is
implemented before its documentation has been written and approved.

## Documentation index

| Document | Status | Phase |
|----------|--------|-------|
| [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) | 🟡 Awaiting approval | 1 — Documentation |
| [ROADMAP.md](./ROADMAP.md) | 🟡 Awaiting approval | 1 — Documentation |
| [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) | 🟡 Awaiting approval | 3 — Architecture |
| [PROJECT_SETUP.md](./PROJECT_SETUP.md) | ✅ Executed (P0 bootstrapped) | P0 — Foundations |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ⚪ Not started | 3 — Architecture |
| [DATABASE.md](./DATABASE.md) | ⚪ Not started | 5 — Database |
| [API_SPEC.md](./API_SPEC.md) | ⚪ Not started | 6 — API |
| [SECURITY.md](./SECURITY.md) | ⚪ Not started | Cross-cutting |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 🟡 Awaiting approval (tokens implemented in `packages/ui`) | 4 — Component Design |
| [ICON_SYSTEM.md](./ICON_SYSTEM.md) | 🟡 Awaiting approval (implemented in `packages/icons`) | 4 — Component Design |
| [ANIMATION_GUIDELINES.md](./ANIMATION_GUIDELINES.md) | 🟡 Awaiting approval (tokens in `packages/ui`) | 4 — Component Design |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | 🟡 Awaiting approval (structure scaffolded in `packages/ui`) | 4 — Component Design |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | 🟡 Awaiting approval | Cross-cutting |

**Legend:** 🟢 Approved · 🟡 Awaiting approval · 🔵 In review · ⚪ Not started

## Component specs

Per-component design specs live in [`components/`](./components/). [`button.md`](./components/button.md)
is the first and doubles as the spec template.

| Component | Status |
|-----------|--------|
| [Button](./components/button.md) | ✅ Implemented (12 tests + stories) |
| [Input](./components/input.md) | ✅ Implemented (11 tests + stories) |
| [Textarea](./components/textarea.md) | ✅ Implemented (11 tests + stories) |
| [Select](./components/select.md) | ✅ Implemented (8 tests + stories) |
| [Checkbox](./components/checkbox.md) | ✅ Implemented (9 tests + stories) |
| [Switch](./components/switch.md) | ✅ Implemented (7 tests + stories) |
| [Radio](./components/radio.md) | ✅ Implemented (7 tests + stories) |
| [Avatar](./components/avatar.md) | ✅ Implemented (9 tests + stories) |
| [Badge](./components/badge.md) | ✅ Implemented (7 tests + stories) |
| [Card](./components/card.md) | ✅ Implemented (7 tests + stories) |
| [Dialog](./components/dialog.md) | ✅ Implemented (6 tests + stories) |
| [Modal](./components/modal.md) | ✅ Implemented (preset over Dialog · 5 tests + stories) |

**Component build order (specs in strict list order, delivered in batches):**

1. **Batch 1 — Forms:** Textarea · Select · Checkbox · Switch · Radio *(+ `Field` wrapper, the shared
   label/error/aria host every control composes into — spec to follow this batch)*
2. **Batch 2 — Display:** Avatar · Badge · Card
3. **Batch 3 — Overlays** (one Radix portal/focus-trap foundation): Modal · Dialog · Popover · Tooltip · Dropdown
4. **Batch 4 — Navigation:** Sidebar · Navbar · Pagination · Breadcrumb · Tabs · Accordion
5. **Batch 5 — Data:** Table · DataGrid · Charts
6. **Batch 6 — Inputs (rich):** File Upload · Image Upload · Date Picker · Calendar
7. **Batch 7 — Feedback:** Toast · Notification · Loading · Skeleton
8. **Batch 8 — Search & command:** Search · Filters · Command Palette

## Delivery process

1. Documentation → 2. Review → 3. Architecture → 4. Component Design →
5. Database → 6. API → 7. Backend → 8. Frontend → 9. Testing → 10. Documentation Update

Steps are never skipped. Each module is shipped in small, independently shippable iterations.
