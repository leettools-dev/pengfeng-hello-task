---
name: general-instrumenting-product-analytics
description: "Define and instrument product usage events — activation, retention, feature adoption — with a stable naming schema, no PII, storage per the data architecture, and results routed back into research and the roadmap."
layer: lifecycle
peers:
  - general-designing-apis
  - general-migrating-data-schemas
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Instrumenting Product Analytics

## Overview

Operational telemetry says the service is up; product analytics says whether
anyone cares. This skill defines usage events (activation, retention, feature
adoption), how to name and store them, and — the part most setups skip — how
the numbers flow back into `docs/research/` and the roadmap.

Storage mechanics follow [data-and-analytics](references/data-and-analytics.md):
events are OLTP writes into append-only Postgres tables; analysis reads
scheduled rollups or materialized views, never heavy scans on the hot tables
serving live writes.

Use this skill when:
- Launching a product (instrument the activation path before launch day)
- Shipping a feature whose adoption should be measured
- A roadmap or research question needs usage evidence

## Define the Questions First

Instrument to answer questions, not to hoard events. The starter set:

| Question | Metric | Events needed |
|----------|--------|---------------|
| Do sign-ups reach value? | Activation rate: % of new users reaching the "first success" within N days | `user_signed_up`, one `*_completed` event marking first success |
| Do they come back? | Retention: % active in week 2, 4 | any qualifying activity event |
| Is feature X used? | Adoption: % of active users using X weekly | `x_used` |
| Where do they stall? | Funnel drop-off on the critical path | one event per funnel step |

Define "first success" from the PRD's value promise — it is the same moment
`gtm-writing-user-documentation` builds getting-started toward.

## Event Schema

```json
{
  "event": "export_completed",
  "user_id": "u_123",
  "occurred_at": "2026-07-10T12:00:00Z",
  "properties": { "format": "csv", "row_count": 1423 }
}
```

- **Naming:** `snake_case`, `<object>_<past-tense-verb>` (`report_exported`,
  not `Export` or `clicked_export_btn`). Name the user action, not the UI
  widget — buttons move, actions persist.
- **Registry:** every event is declared in `design/schemas/analytics-events.md`
  (name, when fired, properties, question it serves) before it is emitted.
  Renaming an event is a breaking change to history: add a new event and
  deprecate the old in the registry instead.
- **No PII, ever.** `user_id` references, never emails, names, IPs, or
  free-text user content in properties. Analytics tables should survive a
  data-subject export/deletion request by joining on `user_id` alone.
- **Server-side where possible.** Emit from the backend route/service that
  performs the action — ad blockers eat client events, and the server knows
  the truth.

## Close the Loop

Numbers that no decision reads are storage costs. Route results:

- A recurring review (weekly is enough) computes the starter metrics; keep
  the queries in `ops/` or `design/schemas/` so they're re-runnable.
- Findings worth acting on become a dated summary via
  `dev-cycle-synthesizing-research` — analytics is a research source like
  interviews are — and re-prioritize the roadmap via `dev-cycle-managing-roadmaps`.
- After each feature launch, check its adoption metric at 2 and 6 weeks and
  record the result in the roadmap's Shipped row.

## Anti-Patterns

- **Track everything.** Hundreds of unregistered events, none answering a question.
- **Widget-named events.** `blue_button_clicked` survives no redesign.
- **PII in properties.** One email address in an event makes the whole table a compliance problem.
- **Write-only analytics.** Instrumented at launch, never queried again.
- **Funnel on the prod DB.** Heavy scans on OLTP — use the analytical path.

## Checklist

- [ ] Each event answers a declared question in the registry
- [ ] Names are `object_past-verb`, action-based, snake_case
- [ ] No PII in any event or property
- [ ] Events emitted server-side on the critical path
- [ ] Activation, retention, adoption queries saved and re-runnable
- [ ] Findings routed to research summaries and the roadmap
