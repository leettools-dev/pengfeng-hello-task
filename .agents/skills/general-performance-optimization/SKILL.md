---
name: general-performance-optimization
description: "Improve frontend, backend, database, API, build, rendering, bundle, memory, latency, and resource performance. Use when asked to make a page, workflow, query, endpoint, build, bundle, animation, or API response faster, smoother, smaller, cheaper, or more scalable."
layer: lifecycle
peers:
  - general-instrumenting-product-analytics
  - general-setting-up-observability
  - general-testing-strategies
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Performance Optimization

Optimize the real bottleneck first. Preserve correctness, accessibility,
security, privacy, and maintainability over micro-optimizations.

Read [performance budgets](references/performance-budgets.md) before
changing budgeted behavior. Use stack-specific skills for framework details.

## Find The Bottleneck

Before changing code, identify whether the issue is:

- API route, service, repository, database query, migration, index, or outbound
  call.
- N+1 request/query behavior, broad cache invalidation, or repeated parsing.
- API response shape, payload size, pagination, streaming, compression, or
  over-fetching.
- React/Vue rendering, server-state cache churn, client store updates, route
  transitions, hydration, or expensive derived data.
- Long lists, tables, timelines, logs, comments, code views, or tree rendering.
- CSS layout thrash, expensive animation, image/font loading, bundle size, or
  initial load.
- Memory retention, unbounded queues, connection pools, file scans, or CPU-bound
  work on the main event loop.

Use local profiling, logs, query plans, timing instrumentation, browser
performance tools, bundle analysis, or targeted tests when practical.

## Implementation Rules

- Measure or reason concretely about the before/after path; avoid blind tuning.
- Fix unbounded work, N+1 calls, repeated parsing, unnecessary serialization,
  large object retention, and broad invalidation before adding complex caching.
- Prefer pagination, limits, streaming, virtualization, summaries, or explicit
  detail endpoints over shipping unbounded payloads to the client.
- Add indexes or query rewrites when data growth is the bottleneck, and keep
  migrations forward-safe.
- Keep cache keys precise. Do not persist secrets, tokens, credentials, raw
  sensitive records, or privacy-sensitive findings in browser storage.
- Animate only properties that avoid layout work, usually `transform` and
  `opacity`, and respect `prefers-reduced-motion`.
- Keep code readable. If an optimization hides invariants, introduce a focused
  helper or test.

## Verification

Use focused evidence:

- Unit, service, repository, or route tests for changed behavior.
- Query plan or timing evidence for database/backend hot paths.
- Browser checks for smoothness, no layout shift, and no console/API failures
  when UI rendering changes.
- Bundle or build output when optimizing shipped assets.
- Budget checks from `docs/quality/performance-budgets.md` when budgets exist.

In the final report, state what was optimized, what tradeoff was made, and how
the improvement was verified.
