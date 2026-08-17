---
name: general-setting-up-observability
description: "Stand up the observability baseline for a service in order — structured logs, correlation ids, health endpoint, RED metrics, a recorded tracing decision, then alerts — so code is written with telemetry in mind from day one."
layer: lifecycle
peers:
  - general-handling-errors
  - general-performance-optimization
  - ops-defining-alerts-and-slos
  - security-designing-authentication
  - security-designing-authorization
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Setting Up Observability

## Overview

This skill sequences the setup of telemetry for a service so that, before it
takes real traffic, "what happened to this request?" and "is the system
healthy?" are answerable from telemetry alone. The policy — levels, output and
rotation, metric selection, backend choice, the tracing threshold, redaction —
is canonical in [observability](references/observability.md);
this skill is the setup procedure and the hand-offs to stack skills.

Use this skill when:
- Scaffolding a new backend service or worker
- A service is approaching first deploy without telemetry
- An incident showed a blind spot — a request that could not be traced, a
  failure with no signal

## Setup Order

Each step builds on the previous one; do them in order.

1. **Structured logging.** Load the stack skill —
   `typescript-implementing-logging`
   (pino) or
   `python-implementing-logging`
   (stdlib `logging`). JSON to stdout, level from validated config, redaction
   configured at the logger.
2. **Correlation.** Request id assigned at the edge, present on every log line
   for that request, propagated on outbound calls via header. Carry principal
   and tenant id (not PII) on the request context.
3. **Health and readiness endpoints.** Probeable by the deploy platform;
   readiness reflects bounded dependencies (DB pool, queue connection) without
   cascading failures into probes.
4. **RED metrics.** Instrument with the OpenTelemetry Metrics API — rate,
   errors, duration per route, plus saturation of the bounded resources the
   service actually has. Add a metric only when it will drive an action;
   budgets live in
   [performance-budgets](../general-performance-optimization/references/performance-budgets.md). Backend
   selection (default: SigNoz, self-hosted OTel-native all-in-one) is in
   [observability](references/observability.md#backend).
5. **Tracing decision.** Single process: skip — correlated logs suffice.
   Request crosses process boundaries (service → worker, service → service):
   OpenTelemetry traces, exported to the same backend as metrics. Either way,
   record the decision in the dev spec.
6. **Alerts and SLOs.** Hand off to
   [ops-defining-alerts-and-slos](../ops-defining-alerts-and-slos/SKILL.md);
   instrumentation without alerting is a dashboard nobody watches.

## Standing Up the Backend

Steps 1–5 produce telemetry. They do not produce a place for it to go, and
"queryable" is not a property of the emitting service — it is a property of a
backend that exists. Choosing SigNoz over Datadog decides *what* to run; it does
not run it. On a team with a platform group someone already did; a product built
autonomously has nobody to have done it, and the gap surfaces as "structured
logs are perfect and visible only in `docker logs`".

**Settle this before instrumenting, not after deploying.** Which posture applies
is a capability question — is there a sink this product can write to, and what
credential reaches it — and it is answered the same way and at the same time as
every other question about external services this product will need: by probing
for it, before there is any code that depends on the answer.

| Posture | When it fits | What it needs |
|---------|--------------|---------------|
| **Existing shared collector** | An OTLP endpoint and token are injected into the runtime | Nothing to run: point the exporter at the endpoint and confirm one event arrives |
| **Self-hosted, deployed with the product** | No shared collector; the product already owns its stack | The backend as services in the product's own Compose stack, promoted the same way the app is — the same "own your backing services" stance as the database |
| **The deploy provider's native sink** | The deploy target already collects container output | Usually no new credential: structured JSON on stdout from the deployed container becomes queryable in the provider's log service under the same service account that provisioned the target |

The third is the low-friction default whenever the deploy target has one — a
product deployed to a cloud VM by a service account that can already write logs
reaches "structured logs are queryable in production" with no new infrastructure
and no new secret. Take it before standing up a stack you must then operate.

**Where none is reachable**, say so in the dev spec as recorded debt with the
posture you would adopt when a sink exists, and let the telemetry gate resolve
against that record. What is not acceptable is finding out once the service is
already serving users: the conclusion is identical and everything built on the
assumption of a backend was built blind.

## Writing Code with Telemetry in Mind

Instrumentation added after the fact logs actions; instrumentation designed in
logs decisions. While implementing features:

- Follow
  [Writing Useful Log Lines](references/observability.md#writing-useful-log-lines):
  constant messages with variable fields, outcomes with durations and ids,
  decisions (retry, fallback, cache miss) not just actions.
- Treat telemetry as an interface: field names and levels are load-bearing for
  alerts and dashboards; rename them as deliberately as an API field.
- Emit audit events for security-relevant actions as distinct queryable events
  (see [authentication](../security-designing-authentication/references/authentication.md) /
  [authorization](../security-designing-authorization/references/authorization.md)).

## Verification

- One request is traceable end-to-end in the logs by its id, including an
  outbound call — found by querying the backend, since a log line visible only
  on the host that produced it is not observability.
- The readiness endpoint reports unhealthy when a dependency is down — test it
  by stopping the dependency, not by reading the code.
- Production-mode log output is valid JSON, and a deliberately logged fake
  secret comes out redacted.
- Load-bearing telemetry (audit events, error paths) is asserted in tests —
  the event is emitted, not just that the code ran.

## Checklist

- [ ] Structured JSON logs to stdout, level from config, redaction on
- [ ] Request/correlation id on every request log line and outbound call
- [ ] Health/readiness endpoints wired to the deploy platform's probes
- [ ] RED metrics per route + saturation of bounded resources, nothing speculative
- [ ] A backend actually exists and is reachable — posture chosen (shared collector, self-hosted with the product, or the deploy provider's native sink), or its absence recorded as debt
- [ ] Metrics/traces instrumented via the OpenTelemetry SDK; backend chosen and recorded in the dev spec (default: SigNoz)
- [ ] One event emitted by the running service found by querying that backend, not by reading the container's stdout
- [ ] Tracing decision recorded in the dev spec
- [ ] Alerts/SLOs defined via `ops-defining-alerts-and-slos`
- [ ] Verification steps above performed, not assumed
