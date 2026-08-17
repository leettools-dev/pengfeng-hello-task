# References

## Official

- [pino documentation](https://getpino.io/) — start here
- [pino API](https://getpino.io/#/docs/api) — logger options, `child()`, serializers, `redact`
- [pino transports](https://getpino.io/#/docs/transports) — pino-pretty, shipping to aggregators
- [Fastify logging](https://fastify.dev/docs/latest/Reference/Logging/) — built-in pino integration, `request.log`, `genReqId`
- [pino-pretty](https://github.com/pinojs/pino-pretty) — dev-only human-readable rendering
- [Docker logging drivers](https://docs.docker.com/engine/logging/configure/) — how the daemon captures and rotates container stdout/stderr

## Canonical Policy

- [observability](../general-setting-up-observability/references/observability.md) — levels, stdout/stderr policy, rotation, redaction requirements, writing useful log lines

## Related Skills

- [../general-handling-errors/](../general-handling-errors/) — when and where to log errors vs. propagate
- `backend-typescript-building-fastify-services` — where the logger sits in the service scaffold
- `python-implementing-logging` — the Python counterpart of this skill
- [../general-setting-up-observability/](../general-setting-up-observability/) — sequencing logs, correlation, health, and metrics for a service

## Common Configurations

### Fastify logger with redaction and dev pretty-printing

```typescript
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { config } from "./config/index.js";

Fastify({
  logger: {
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.secret",
      ],
      censor: "[REDACTED]",
    },
    transport:
      config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
  },
  genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
});
```

### Custom serializer for a domain object

```typescript
const logger = pino({
  serializers: {
    order: (o) => ({ id: o.id, status: o.status, total: o.total }),
  },
});
logger.info({ order }, "order updated"); // logs only the safe projection
```

### Runner-side rotation (never in-process)

A copyable runner script that wraps any command with `rotatelogs`-based
rotation and pruning:
[scripts/run-with-log-rotation.sh](scripts/run-with-log-rotation.sh)
(with [scripts/log-prune.sh](scripts/log-prune.sh)).

Docker — the daemon rotates the container's stdout/stderr:

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
```

or per container: `docker run --log-opt max-size=10m --log-opt max-file=5 …`

Bare process with a `LOG_FILE` override — `logrotate` owns the file:

```
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
```

`copytruncate` avoids coordinating a reopen signal with the process; accept
the small window of loss it implies.

## Tips

1. **Merge object first** — `logger.info({ fields }, "message")`; the reversed
   order silently drops fields.
2. **`{ err }` for every caught error** — the key name matters; it triggers the
   stack-preserving serializer.
3. **`request.log` over `app.log` in handlers** — free request-id correlation.
4. **One root logger** — modules take `child()` loggers, never construct their own.
5. **Test redaction** — log a fake token in a test and assert the output says
   `[REDACTED]`.
6. **`isLevelEnabled("debug")`** — gate expensive payload construction, not just
   the log call.
