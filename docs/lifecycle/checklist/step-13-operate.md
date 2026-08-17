# Checklist — Step 13: Operate it

Gate (from lifecycle): Alerts exist for the failure modes named in the dev
spec; runbook exists for each alert.

## ops.alerts-per-failure-mode.health-check-down — Health-check-down failure mode has an alert  [must]

- Invariant: A failure mode "`GET /health` does not return 200" has an alert
  rule as code that fires on it.
- Evidence required: `ops/alerts/` rule for health-check failure.
- Counterexample: The service can be down with nobody paged.
- Applies when: The product runs a deployed service. Expand per named failure
  mode.
- Applicability: Capability record `deploy-target` = `available`; the product
  is deployed as a service. The only failure mode this static, dependency-free
  service can meaningfully have is process/service down, which
  `ops/runbooks/hello-world.md` already names as its symptom ("`GET /health`
  does not return 200"). No other failure mode is named (no database, no
  external API per PRD §Technical Notes).
- Status: PENDING
- Note: `ops/alerts/README.md` is currently a placeholder with no rules; a
  concrete alert on `/health` failing needs to be added and named for
  hello-task specifically (the existing `ops/runbooks/hello-world.md` is
  scaffold-generic and not yet retitled for this product).

## ops.runbook-per-alert.health-check-down — Health-check-down alert has a runbook  [must]

- Invariant: The health-check-down alert links a runbook that says what to
  check and do when it fires, including when to escalate to a human.
- Evidence required: `ops/runbooks/` entry for the health-check-down alert.
- Counterexample: The alert pages someone at 3am with no runbook behind it.
- Applies when: Alerts exist. Expand per alert.
- Applicability: `ops.alerts-per-failure-mode.health-check-down` applies and
  will define exactly one alert once written.
- Status: PENDING
- Note: `ops/runbooks/hello-world.md` already has matching content (checks
  process running, `PORT`/`HOST`, `npm test`) but is titled for the generic
  scaffold baseline, not hello-task specifically; needs to be confirmed/
  retitled to link the actual alert.

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
- Applicability: PRD §Users names an end user, but the PRD states no success
  metrics anywhere and explicitly excludes analytics: §Non-Goals: "Analytics,
  tracking, cookies, or third-party scripts." The PRD-citation branch applies,
  not the capability branch, even though `.agents/capabilities.json` also
  shows `analytics-sink` = `unavailable`.
- Status: N/A — PRD §Non-Goals: "Analytics, tracking, cookies, or third-party
  scripts." No success metrics are stated.

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
- Applicability: `.agents/capabilities.json` probe `telemetry-sink` verdict =
  `unavailable`, evidence: "no OTEL_EXPORTER_OTLP_ENDPOINT, no GCP credentials
  for a provider-native sink, and no telemetry service in
  deploy/local/docker-compose.yml. Logs would be visible only on the host
  that runs the container."
- Status: N/A — capability:telemetry-sink unavailable — "no
  OTEL_EXPORTER_OTLP_ENDPOINT, no GCP credentials for a provider-native sink,
  and no telemetry service in deploy/local/docker-compose.yml. Logs would be
  visible only on the host that runs the container." (recorded as debt: pino
  logs exist but are not shipped anywhere queryable in production)
