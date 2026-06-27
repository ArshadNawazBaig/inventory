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
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 🔵 In review — authored, awaiting approval | 3 — Architecture |
| [DATABASE.md](./DATABASE.md) | 🔵 In review — authored, awaiting approval | 5 — Database |
| [API_SPEC.md](./API_SPEC.md) | ⚪ Not started | 6 — API |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | 🔵 In review — authored, awaiting approval | Cross-cutting (auth deep-dive) |
| [SECURITY.md](./SECURITY.md) | ⚪ Not started | Cross-cutting |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 🟡 Awaiting approval (tokens implemented in `packages/ui`) | 4 — Component Design |
| [ICON_SYSTEM.md](./ICON_SYSTEM.md) | 🟡 Awaiting approval (implemented in `packages/icons`) | 4 — Component Design |
| [ANIMATION_GUIDELINES.md](./ANIMATION_GUIDELINES.md) | 🟡 Awaiting approval (tokens in `packages/ui`) | 4 — Component Design |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | 🟡 Awaiting approval (structure scaffolded in `packages/ui`) | 4 — Component Design |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | 🟡 Awaiting approval | Cross-cutting |

**Legend:** 🟢 Approved · 🟡 Awaiting approval · 🔵 In review · ⚪ Not started

## Module specs

Per-module design specs (entities · DTOs · validation · API · permissions · workflow) live in
[`modules/`](./modules/).

| Module | Bounded context | Status |
|--------|-----------------|--------|
| [Product](./modules/product.md) | Catalog | 🟢 Backend implemented (in-memory adapter · 27 tests · Swagger) |

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
| [Popover](./components/popover.md) | ✅ Implemented (6 tests + stories) |
| [Tooltip](./components/tooltip.md) | ✅ Implemented (6 tests + stories) |
| [Dropdown](./components/dropdown.md) | ✅ Implemented (6 tests + stories) |
| [Sidebar](./components/sidebar.md) | ✅ Implemented (5 tests + stories) |
| [Navbar](./components/navbar.md) | ✅ Implemented (5 tests + stories) |
| [Pagination](./components/pagination.md) | ✅ Implemented (12 tests + stories) |
| [Breadcrumb](./components/breadcrumb.md) | ✅ Implemented (8 tests + stories) |
| [Tabs](./components/tabs.md) | ✅ Implemented (7 tests + stories) |
| [Accordion](./components/accordion.md) | ✅ Implemented (6 tests + stories) |
| [Table](./components/table.md) | ✅ Implemented (6 tests + stories) |
| [DataGrid](./components/data-grid.md) | ✅ Implemented (8 tests + stories) |
| [Charts](./components/charts.md) | ✅ Implemented (7 tests + stories) |
| [Calendar](./components/calendar.md) | ✅ Implemented (7 tests + stories) |
| [Date Picker](./components/date-picker.md) | ✅ Implemented (Popover + Calendar · 9 tests + stories) |
| [File Upload](./components/file-upload.md) | ✅ Implemented (native dropzone · 11 tests + stories) |
| [Image Upload](./components/image-upload.md) | ✅ Implemented (thumbnails · shares useFileUpload · 10 tests + stories) |
| [Toast](./components/toast.md) | ✅ Implemented (Radix + imperative store · 7 tests + stories) |
| [Notification](./components/notification.md) | ✅ Implemented (inline alert banner · 7 tests + stories) |
| [Loading](./components/loading.md) | ✅ Implemented (Spinner · Progress · Overlay · 11 tests + stories) |
| [Skeleton](./components/skeleton.md) | ✅ Implemented (Skeleton · SkeletonText · 7 tests + stories) |
| [Search](./components/search.md) | ✅ Implemented (debounced · composes Input · 7 tests + stories) |
| [Filters](./components/filters.md) | ✅ Implemented (filter bar · chips + editors · 7 tests + stories) |
| [Command Palette](./components/command-palette.md) | ✅ Implemented (cmdk + Dialog · ⌘K · 7 tests + stories) |

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
