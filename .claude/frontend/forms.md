# Forms

> **Status:** 🟡 Seed · **Owner:** Frontend Lead · **Related:** [state-management](./state-management.md) · [backend/validation](../backend/validation.md)

## Purpose
A single, consistent forms approach: React Hook Form + Zod, sharing schemas with the backend.

## Rules
- **One schema, two sides:** Zod schemas live in `packages/types` and are used by both the
  form (`zodResolver`) and the API DTO validation — the contract is identical.
- Use design-system form components (`Input`, `Select`, `Checkbox`, …) wired via RHF `Controller`
  or `register`; never raw inputs.
- Show inline, field-level errors from the resolver; summarize server errors at the top.
- Disable submit while pending; prevent double-submit; show optimistic/loading feedback.
- Default values are explicit; controlled vs uncontrolled is consistent per form.
- Accessibility: every field has a `<label>`, error text linked via `aria-describedby`,
  invalid fields get `aria-invalid`. See [accessibility](./accessibility.md).

## Patterns
- Multi-step forms keep one schema split into per-step refinements.
- Async uniqueness checks (e.g., SKU) debounce and reconcile with server validation on submit.
- Map API field errors back to form fields by name.
