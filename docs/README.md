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
| [Button](./components/button.md) | 🟡 Awaiting approval (design only) |

## Delivery process

1. Documentation → 2. Review → 3. Architecture → 4. Component Design →
5. Database → 6. API → 7. Backend → 8. Frontend → 9. Testing → 10. Documentation Update

Steps are never skipped. Each module is shipped in small, independently shippable iterations.
