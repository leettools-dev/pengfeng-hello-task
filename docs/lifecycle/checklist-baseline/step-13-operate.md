# Baseline Checklist — Step 13: Operate it

Gate (from app-building.md): Alerts exist for the failure modes named in the dev
spec; runbook exists for each alert.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## ops.alerts-per-failure-mode — Every named failure mode has an alert  [must]  (per failure mode)

- Invariant: Each failure mode the dev spec names (site down, error-rate spike,
  key latency SLO) has an alert rule as code that fires on it.
- Evidence required: `ops/alerts/` rules, one per named failure mode.
- Counterexample: The spec names a vote-latency SLO but nothing alerts on it.
- Applies when: The product runs a deployed service. Expand per named failure
  mode.
- Status: PENDING

## ops.runbook-per-alert — Every alert has a runbook  [must]  (per alert)

- Invariant: Each alert links a runbook that says what to check and do when it
  fires, including when to escalate to a human.
- Evidence required: `ops/runbooks/` entry per alert.
- Counterexample: An alert pages someone at 3am with no runbook behind it.
- Applies when: Alerts exist. Expand per alert.
- Status: PENDING

## ops.analytics-events — Adoption questions have instrumented events  [must]

- Invariant: When the PRD states success metrics, the product emits analytics
  events that answer its activation, retention, and adoption questions ("is
  anyone using this?"), and they reach a destination someone can query.
- Evidence required: The PRD's success questions quoted, the instrumented events
  mapped to them, and sample events observed at the destination.
- Counterexample: The PRD asks "how many polls get shared?" and nothing tracks
  shares.
- Counterexample: The PRD states no success metrics, yet the item is
  instantiated `PENDING` and survives to the completion gate, where an
  invocation reaches the same `N/A` conclusion at the most expensive possible
  moment.
- Applies when: The product has end users **and the PRD states success
  metrics**. When the PRD names none, this is `N/A` with the PRD citation,
  decided at instantiation. When the PRD names metrics but the capability record
  shows no analytics destination, it is
  `N/A — capability:analytics-sink unavailable …` with the gap recorded as debt.
- Status: PENDING

## ops.telemetry-flowing — Logs and traces reach the telemetry backend  [must]

- Invariant: Structured logs and traces from the running service reach a
  telemetry backend that exists and are queryable there.
- Evidence required: A query in the telemetry backend returning the app's events.
- Counterexample: The service logs locally but nothing is visible in production
  observability.
- Counterexample: Logging, correlation, and health endpoints are all built
  correctly, and only at this step does anyone ask where the telemetry was
  supposed to go.
- Applies when: The product runs a deployed service and the capability record
  shows a reachable telemetry sink. Where the record shows none, this is
  `N/A — capability:telemetry-sink unavailable …` decided at instantiation, with
  the missing backend recorded as debt — never `PENDING` at the completion gate.
- Status: PENDING
