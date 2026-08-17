# Observability

You cannot operate a transactional application you cannot see. Observability is
the ability to answer "what happened to this request?" and "is the system
healthy?" from telemetry alone. Keep it lightweight: structured logs first,
metrics where they pay for themselves, tracing when a request crosses
services. Logs stay on pino/stdlib logging; metrics and traces are
instrumented once via the OpenTelemetry SDK so the backend can change without
touching application code.

## Structured Logging

- **Log structured JSON, not formatted strings.** Use
  [pino](https://getpino.io/) on the Fastify stack (the default logger). Strings
  are for humans at a terminal; production logs are queried. `[Specification, must-have]`
- **One logger, levels used deliberately:** `error` (needs attention),
  `warn` (degraded but handled), `info` (significant state change),
  `debug` (diagnostic, off in production).
- **Never log secrets or PII.** Configure redaction for tokens, passwords,
  authorization headers, and personal data at the logger. `[Specification, must-have]`
- **Log errors with their stack and context**, never a bare message — consistent
  with [general-handling-errors](../../general-handling-errors/SKILL.md).
  Do not log-and-swallow; log at the boundary that handles the error.
- Stack mechanics live in the skills:
  `typescript-implementing-logging`
  (pino) and
  `python-implementing-logging`
  (stdlib `logging`).

## Log Output and Rotation

- **Programs write to stdout/stderr by default.** Services emit their log
  stream on stdout ([12-factor logs](https://12factor.net/logs)); CLIs log to
  stderr so stdout stays pipeable and diagnostics never corrupt program
  output. `[Specification, must-have]`
- **The destination is a config override, not a code change.** The logger may
  support an optional file destination (e.g. a `LOG_FILE` setting) for runners
  that need one; the default stays the standard streams, and code never
  hardcodes a file path. `[Guidance, should-have]`
- **Redirect-to-file and rotation belong to the runner, not the program.**
  Under Docker, the daemon captures stdout/stderr and rotates via the log
  driver (`json-file` with `max-size`/`max-file`, or a shipping driver); under
  systemd, journald does; a bare process redirected to a file is rotated by
  `logrotate`. The application never rotates its own logs — an unbounded,
  unrotated file is a scheduled outage, and it is the runner's job to prevent
  it. `[Specification, must-have]`
- A copyable runner that does the redirect-and-rotate for bare processes
  (via Apache `rotatelogs`, with count-based pruning) is
  the `run-with-log-rotation.sh` helper shipped with the stack logging skill.
- **Pretty-printing is a dev-only rendering** (`pino-pretty`, colored console
  formatters). Production output stays machine-parseable JSON.

## Writing Useful Log Lines

A log line is written once and read a hundred times, usually during an
incident, by someone (or an agent) without the code open. Write for that
reader:

- **Keep the message constant; put variables in fields.** `"payment failed"`
  with `{orderId, attempt, reason}` groups and counts in a log query;
  `"payment for order 8123 failed on attempt 3"` does not.
- **Record events and outcomes, not narration.** Log that something completed
  with its result and duration (`"import finished"`, `{rows: 5000, ms: 1200}`),
  not `"about to start importing"`. Emit a separate start line only when the
  operation runs long enough that detecting a hang matters.
- **Log decisions, not just actions**: retries, fallbacks, cache misses,
  feature-flag branches — anything that explains why later behavior differed.
- **Every line carries enough context to act**: entity ids, attempt counts,
  durations, sizes. A message that would not help at 3 a.m. ("something went
  wrong") should not ship.
- **`debug` reconstructs control flow without a debugger** — branch points and
  key intermediate values — and must stay safe to enable in production: no
  secrets, no per-item lines in hot loops (log a summary with counts instead).
- **`error` implies action.** A line at `error` means a human or alert should
  look. Expected domain failures (validation errors, 404s) log at `warn` or
  `info`, or they train responders to ignore `error`.

## Correlation

- Assign a **request/correlation id** at the edge (Fastify `req.id`), include it
  on every log line for that request, and propagate it on outbound calls via a
  header. `[Specification, must-have]`
- Carry the authenticated principal and tenant id (not PII) on the request log
  context so access can be traced and audited.
- Audit events for security-relevant actions are defined in
  [authentication.md](../../security-designing-authentication/references/authentication.md) and
  [authorization.md](../../security-designing-authorization/references/authorization.md); emit them as distinct,
  queryable events, not buried `info` lines.

## Metrics and Health

- Expose a **health/readiness endpoint** the deploy platform can probe.
- **Instrument with the OpenTelemetry Metrics API**, not a vendor-specific
  client library (e.g. `prom-client`) — the same instrumentation-first
  principle as tracing below, so the backend is a config choice, not a
  rewrite. `[Specification, must-have]`
- Track the few signals that drive decisions — the RED method for services:
  **R**ate, **E**rrors, **D**uration per route — plus saturation of bounded
  resources (DB pool, queue depth, event-loop lag). Resource budgets live in
  [performance-budgets.md](../../general-performance-optimization/references/performance-budgets.md).
- Add a metric when it will change an action (alert, scaling, rollback). Do not
  instrument everything speculatively; cardinality and storage are not free.

## Tracing

- For a single service, request-scoped structured logs with a correlation id are
  usually enough.
- Introduce distributed tracing when a request **crosses process boundaries**
  — backend → worker, or service → service — and log correlation can no
  longer reconstruct the path. Use the same OpenTelemetry SDK as metrics;
  traces and metrics ship to the same backend. Record the decision in the dev
  spec.

## Backend

- **Default: a self-hosted, OpenTelemetry-native, all-in-one platform** —
  [SigNoz](https://signoz.io/) — that ingests OTLP for logs, metrics, and
  traces into one store with one query surface and alerting in the same UI.
  One thing to run and correlate against, instead of assembling
  Prometheus + Loki + Tempo + Grafana as four separately-scaled services.
  `[Specification, should-have]`
- **Lower-footprint alternative:** [OpenObserve](https://openobserve.ai/) — a
  single binary, object-storage-backed, also OTel-native — when minimizing
  running processes matters more than SigNoz's more complete built-in
  alerting.
- **Fallback: Prometheus + Grafana** (+ Loki/Tempo for logs/traces) needs a
  rationale, like any deviation from a stack default — an existing team
  investment, a required integration, or ops capacity to run and scale four
  components instead of one.
- Whichever backend is chosen, application code depends only on the
  OpenTelemetry SDK and an OTLP exporter; the backend is configuration, and
  the choice is recorded in the dev spec.

## Operational Practice

- Treat logs/metrics as an interface: a renamed field or level can break an
  alert or dashboard. Change them deliberately.
- Make telemetry verifiable in tests where it is load-bearing (audit events,
  error paths) — assert the event is emitted, not just that the code ran.

## Primary References

- [The Twelve-Factor App: Logs](https://12factor.net/logs)
- [pino documentation](https://getpino.io/)
- [Fastify logging](https://fastify.dev/docs/latest/Reference/Logging/)
- [OpenTelemetry for JS](https://opentelemetry.io/docs/languages/js/)
- [The RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [SigNoz documentation](https://signoz.io/docs/) — default backend
- [OpenObserve documentation](https://openobserve.ai/docs/) — lower-footprint alternative
- [@fastify/otel](https://github.com/fastify/otel) — official Fastify OpenTelemetry instrumentation
