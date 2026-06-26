# Performance (quality)

> **Status:** 🟡 Seed · **Owner:** Principal Architect · **Related:** [architecture/scalability](../architecture/scalability.md) · [frontend/performance](../frontend/performance.md) · [database/indexes](../database/indexes.md)

## Purpose
Performance is a feature. Measure, then optimize the real bottleneck.

## Backend targets & rules
- P95 reads < 300 ms, writes < 600 ms.
- No **N+1** queries; batch/aggregate; project only needed fields.
- Every hot query has a supporting index (verified with `explain`). See [database/indexes](../database/indexes.md).
- Paginate everything; never load unbounded sets.
- Cache hot, slow-changing reads in Redis with explicit invalidation.
- Heavy/aggregation work → background jobs + read models. See [backend/queues](../backend/queues.md).

## Frontend
- Web Vitals budgets (LCP/INP/CLS); code-split heavy widgets; virtualize big lists.
  See [frontend/performance](../frontend/performance.md).

## Process
- Profile before optimizing; attach before/after numbers to performance PRs.
- Track latency/throughput in monitoring; alert on regressions. See [devops/monitoring](../devops/monitoring.md).
- Add a perf regression test for fixed hotspots where feasible.

## Anti-patterns to reject in review
Unbounded `find()`, missing index on new filter/sort, per-row queries in loops, computing
aggregates on the request path, shipping raw datasets to the client.
