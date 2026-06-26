# Routing

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [nextjs](./nextjs.md)

## Purpose
Route organization and access control in the App Router.

## Structure (route groups)
```
app/
  (auth)/         # login, signup, accept-invite — unauthenticated
  (app)/          # authenticated shell (sidebar/navbar)
    dashboard/
    products/        [list] / [id] / new
    inventory/       movements / adjustments / transfers / counts
    locations/
    purchasing/      suppliers / purchase-orders
    sales/           sales-orders
    reports/
    settings/        org / members / roles / billing
  (marketing)/    # public pages (optional)
```

## Conventions
- URLs are plural, kebab-case (`/purchase-orders/:id`) — mirror API resource names.
- Each route segment ships `loading.tsx` and `error.tsx`.
- Authenticated layout enforces session; unauthorized users redirect to login.
- **Permission-gated UI** uses the `PermissionWrapper` component (mirrors server RBAC).
- Deep-linkable filters/sort live in the URL query string (shareable state).

## Guards
- Route access reflects RBAC permissions; the server still enforces every action regardless of UI.
