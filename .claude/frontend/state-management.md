# State Management

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [nextjs](./nextjs.md) · [forms](./forms.md)

## Purpose
Pick the right state tool for each kind of state — no over-centralization.

## Taxonomy
| State kind | Tool | Notes |
|------------|------|-------|
| **Server state** (data from API) | **TanStack Query** | Caching, refetch, mutations, optimistic updates |
| **URL state** (filters, sort, page) | Next.js router / search params | Shareable, deep-linkable |
| **Global client state** (UI prefs, theme, command palette, sidebar) | **Zustand** | Small, sliced stores |
| **Form state** | **React Hook Form** | With Zod resolver |
| **Local component state** | `useState`/`useReducer` | Keep it local |

## Rules
- Server data lives in TanStack Query — **never** mirror it into Zustand.
- Zustand stores are small and sliced by concern; no "god store".
- Query keys are typed and centralized per feature.
- Mutations invalidate the minimal set of queries; use optimistic updates only where safe to roll back.
- Derive, don't duplicate: compute from source state rather than syncing copies.
