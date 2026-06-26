# Prompt: Debug

> **Status:** 🟡 Seed · **Owner:** Eng · **Use:** diagnosing a bug/incident.

Debug methodically. Find the **root cause**, not a symptom patch.

## Process
1. **Reproduce** — exact steps, environment, inputs; capture the failing behavior.
2. **Gather evidence** — logs (correlation id), Sentry trace, recent deploys, related changes.
3. **Localize** — narrow to module/layer; confirm with a failing test that reproduces it.
4. **Root cause** — explain *why* it happens (state, race, validation gap, index, tenant scope…).
5. **Fix** — minimal, correct change at the right layer.
6. **Prevent** — add a regression test; note any related latent issues.

## Inventory-specific suspects
- Stock drift → check ledger vs projection reconciliation, missing transaction, non-idempotent job.
- Access bug → tenant scoping or permission check missing/incorrect.
- Performance → missing index, N+1, unbounded query.

## Output (format)
1. Analysis (symptom → evidence → root cause)
2. The fix (with file:line)
3. Regression test
4. Notes: blast radius, related risks, follow-ups.

## Don't
- Don't suppress errors or add retries to hide a logic bug. Don't fix in prod by hand.
