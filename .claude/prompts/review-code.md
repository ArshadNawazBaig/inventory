# Prompt: Review Code

> **Status:** 🟡 Seed · **Owner:** Eng · **Use:** reviewing a diff/PR.

Review the change as a Principal Engineer against StockFlow standards ([CLAUDE.md](../CLAUDE.md)).
Be specific; cite files/lines; suggest fixes with rationale; separate blocking from non-blocking.

## Check, in priority order
1. **Security** — tenant scope + permission check present? Input validated, output allow-listed?
   No secrets? Cross-tenant → 404? See [security/owasp](../security/owasp.md).
2. **Correctness** — invariants (e.g., `available ≥ 0`), edge/error paths, ledger/transaction use.
3. **Architecture** — layering, module boundaries, dependency rules; logic in the right layer.
4. **Types** — no `any`/ignores; precise types; shared contracts updated.
5. **Tests** — unit/integration/permission/tenant tests adequate; regression for bugs.
6. **UI** — from `@stockflow/ui`; accessible; responsive; light/dark.
7. **Performance** — no N+1/unbounded queries; indexes for new query patterns.
8. **Docs** — `.claude`/`docs`/Swagger/permission catalog updated.

## Output
- **Blocking issues** (must fix) with file:line and suggested change.
- **Non-blocking** improvements.
- **Praise** what's done well.
- Verdict: approve / request changes.
