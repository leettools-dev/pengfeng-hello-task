# Performance and Resource Budgets

This stack is chosen for simplicity and light resource usage. That goal only
holds if it is measured: a budget turns "feels fast" and "seems light" into
numbers CI can defend. Set budgets from the workload, then treat a regression
past them as a defect, not a tuning preference.

## Set Budgets per Workload

Define explicit targets in the dev spec for the dimensions that matter to the
app. Typical starting budgets — adjust to the product:

| Dimension | Example budget |
|-----------|----------------|
| API latency (read) | p95 < 200 ms, p99 < 500 ms at expected concurrency |
| API latency (write) | p95 < 400 ms |
| Analytical query | Interactive < 1 s; report/batch documented separately |
| Frontend initial JS | < 200 KB gzipped on the critical path |
| Web vitals | LCP < 2.5 s, INP < 200 ms on target hardware/network |
| Memory (service) | Steady-state RSS ceiling per instance |
| DB connections | Pool sized to the instance; bounded, never unbounded |

A budget without a number is not a budget. Record the assumed concurrency and
hardware alongside it — latency is meaningless without them.

## Backend and Data

- **Bound everything that can grow:** pagination on list endpoints, `LIMIT` on
  queries, timeouts on outbound calls, a capped DB pool and queue depth.
  Unbounded work is the usual cause of a "light" app falling over under real
  load. `[Specification, must-have]`
- **Push data work into the database.** Aggregate and filter in SQL; do not pull
  rows into the app to reduce them — see
  [data-and-analytics.md](../../general-instrumenting-product-analytics/references/data-and-analytics.md).
- **Watch the event loop.** Keep CPU-bound work off the main loop (stream, batch,
  or offload to a worker/job); track event-loop lag as a saturation signal in
  [observability.md](../../general-setting-up-observability/references/observability.md).
- **Find N+1 and full scans before shipping.** Review query plans for hot paths;
  index the columns the workload filters and joins on.

## Frontend

- **Ship less JavaScript.** Code-split by route, lazy-load heavy views, and keep
  the critical-path bundle under budget. The bundle size is a CI check, not a
  vibe.
- **Virtualize large lists/tables** instead of rendering thousands of nodes —
  relevant for the data-heavy views this stack targets.
- **Render server-derived data; don't recompute in the client** what the API can
  return already shaped.

## Verification

- Budgets are enforced as non-functional tests in the scheduled CI tier (see
  [testing-strategy.md](../../general-testing-strategies/references/testing-strategy.md)): load/latency checks on critical
  endpoints and a bundle-size assertion on the frontend.
- Measure before optimizing. Attach a profile or query plan to any performance
  change so the regression and the fix are both evidenced.
- A change that breaches a recorded budget is a release blocker until the budget
  is met or deliberately revised (with rationale) in the dev spec.

## Primary References

- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)
- [Node.js — Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Postgres — Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
