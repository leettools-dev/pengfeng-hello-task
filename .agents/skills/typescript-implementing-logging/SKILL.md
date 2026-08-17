---
name: typescript-implementing-logging
description: "Implement TypeScript/Node logging with pino — logger setup for Fastify services and standalone processes, levels from config, request-scoped child loggers, error serialization, redaction, dev pretty-printing, and stdout/stderr output with a config-driven file override."
layer: lifecycle
applies_when:
  language: [typescript]
peers:
  - general-handling-errors
  - general-setting-up-observability
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Implementing Logging in TypeScript

## Overview

This skill covers logging in TypeScript/Node services, workers, and CLIs using
[pino](https://getpino.io/), the stack default. Logging **policy** — levels,
output destination, rotation, redaction, and how to write useful lines — is
defined in [observability](../general-setting-up-observability/references/observability.md); this
skill covers the pino mechanics that implement it.

Use this skill when:
- Wiring the logger in a new Fastify service, worker, or CLI
- Adding request context, redaction, or a config-driven output destination to existing logging
- Replacing `console.log` calls in application code

Prerequisites: none.

## Key Concepts

- **One root logger per process**, configured at the entry point. Everything
  else derives context from it via `logger.child({...})` — never a second
  `pino()` call at a call site.
- **Fastify owns the logger.** Pass pino options to `Fastify({ logger })`; use
  `request.log` inside handlers (it is a child logger carrying `req.id`) and
  `app.log` outside requests.
- **Merge object first, message second:** `logger.info({ orderId }, "order created")`.
  Fields go in the object; the message string stays constant so lines group in
  queries.
- **Errors go under the `err` key:** `logger.error({ err }, "charge failed")`
  triggers pino's error serializer (type, message, stack). Logging
  `err.message` throws the stack away.

## Implementation Guide

### Step 1: Configure once at the entry point

Fastify service — the logger is part of app construction:

```typescript
// src/app.ts
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { config } from "./config/index.js";

export function buildApp() {
  return Fastify({
    logger: {
      level: config.LOG_LEVEL, // validated by env-schema; default "info"
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.secret",
      ],
    },
    genReqId: (req) =>
      (req.headers["x-request-id"] as string) ?? randomUUID(),
  });
}
```

Standalone worker:

```typescript
// src/logger.ts
import pino from "pino";
import { config } from "./config/index.js";

export const logger = pino({ level: config.LOG_LEVEL });
```

CLI — logs go to **stderr** so stdout stays pipeable (per
[observability policy](../general-setting-up-observability/references/observability.md#log-output-and-rotation)):

```typescript
import pino from "pino";
import { config } from "./config/index.js";

export const logger = pino({ level: config.LOG_LEVEL }, pino.destination(2));
```

### Step 2: Set the level from config, use it deliberately

`LOG_LEVEL` comes from validated env config, never hardcoded. Level semantics
(`error` needs attention, `warn` degraded/expected failure, `info` significant
state change, `debug` diagnostics) are defined in the
[observability doc](../general-setting-up-observability/references/observability.md#structured-logging).

### Step 3: Carry request and job context via child loggers

```typescript
app.get("/api/v1/orders/:id", async (request, reply) => {
  // request.log already carries reqId — every line is correlated
  request.log.info({ orderId: request.params.id }, "order fetched");
});
```

Propagate the correlation id on outbound calls:

```typescript
await fetch(url, { headers: { "x-request-id": request.id } });
```

Background jobs bind their context once:

```typescript
const jobLog = logger.child({ job: "nightly-export", runId });
jobLog.info("run started");
```

### Step 4: Log errors with `err` at the handling boundary

```typescript
try {
  await chargeCard(order);
} catch (err) {
  request.log.error({ err, orderId: order.id, attempt }, "charge failed");
  throw err; // or handle it here — never log-and-swallow
}
```

When and where to log vs. rethrow follows
[general-handling-errors](../general-handling-errors/SKILL.md).

### Step 5: Pretty in dev, JSON in production

`pino-pretty` is a dev dependency, wired as a transport only outside
production:

```typescript
logger: {
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
}
```

Alternatively pipe without touching app config: `node dist/server.js | pino-pretty`.

### Step 6: Output destination — streams by default, file by config

Default: JSON to stdout (stderr for CLIs), no files. Redirect-to-file and
rotation are the **runner's** job — the Docker daemon's log driver, journald,
or `logrotate` on a redirected stream — never the application's (see
[observability policy](../general-setting-up-observability/references/observability.md#log-output-and-rotation)).

Make the destination a config override, not a code change:

```typescript
export const logger = pino(
  { level: config.LOG_LEVEL },
  config.LOG_FILE ? pino.destination(config.LOG_FILE) : pino.destination(1),
);
```

Do not add in-process rotation (`pino-roll` and similar); if a file
destination is configured, the runner that asked for it rotates it.

### Step 7: Gate expensive debug payloads

Arguments are evaluated even when the level is off. Gate costly serialization:

```typescript
if (logger.isLevelEnabled("debug")) {
  logger.debug({ payload: summarize(hugeObject) }, "resolver input");
}
```

## Checklist

- [ ] One root logger configured at the entry point; no `console.log` in `src/`
- [ ] `LOG_LEVEL` from validated config, default `info` (CLIs: `warn`)
- [ ] Services log JSON to stdout; CLIs log to stderr; pretty-printing dev-only
- [ ] `request.log` used in handlers; request id propagated on outbound calls
- [ ] Errors logged as `{ err }` with context, at the boundary that handles them
- [ ] Redaction covers auth/cookie headers, passwords, tokens, secrets
- [ ] Destination overridable via config (`LOG_FILE`); no in-process rotation — the runner rotates
- [ ] Messages constant; variables in the merge object

## Common Pitfalls

**Mistake 1: Variables interpolated into the message**
- Wrong: ``logger.info(`user ${id} logged in`)``
- Right: `logger.info({ userId: id }, "user logged in")`
- Fix: constant message + fields; interpolated strings don't aggregate.

**Mistake 2: Arguments in the wrong order**
- Wrong: `logger.info("order created", { orderId })` — the object is silently
  treated as an interpolation arg and dropped from the JSON.
- Right: `logger.info({ orderId }, "order created")` — merge object first.

**Mistake 3: Losing the stack**
- Wrong: `logger.error(err.message)` or `logger.error({ error: String(err) })`
- Right: `logger.error({ err }, "operation failed")` — the `err` key invokes
  the error serializer.

**Mistake 4: `pino-pretty` in production**
- Wrong: unconditional `transport: { target: "pino-pretty" }`.
- Right: gate on `NODE_ENV`; production stays JSON. Keep `pino-pretty` in
  `devDependencies`.

**Mistake 5: A `pino()` call per module**
- Wrong: each file creates its own logger with its own options.
- Right: one root logger; modules receive it or import the shared instance and
  use `child()` for context.

**Mistake 6: Redaction as an afterthought**
- Wrong: relying on call sites to remember not to log tokens.
- Right: `redact` paths configured at logger creation; call-site discipline is
  the second line of defense, not the first.

## References

See [references.md](references.md) for pino APIs, transports, and
configuration recipes.
