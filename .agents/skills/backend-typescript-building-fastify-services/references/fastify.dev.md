# Fastify Development Conventions

Conventions for building TypeScript backend services with Fastify. This is the recommended backend stack for web apps and browser-server apps: TypeScript in strict mode, Node runtime, npm as the package manager, and storage selected from the workload.

## Table of Contents

1. [Stack](#stack)
2. [Project Structure](#project-structure)
3. [App Bootstrap](#app-bootstrap)
4. [Route Patterns](#route-patterns)
5. [Layering Rules](#layering-rules)
6. [Ports and Adapters](#ports-and-adapters)
7. [Error Handling](#error-handling)
8. [Logging](#logging)
9. [Metrics and Tracing](#metrics-and-tracing)
10. [Configuration](#configuration)
11. [Database Access](#database-access)
12. [Background Jobs](#background-jobs--scheduling)
13. [Security](#security)
14. [Inbound Webhook Verification](#inbound-webhook-verification)
15. [Testing](#testing)
16. [Summary Checklist](#summary-checklist)

## Stack

| Concern | Selection |
|---------|-----------|
| Language | TypeScript, `"strict": true` |
| Runtime | Node 24 — see [Node.js Version Policy](../../system-developing-with-docker/references/docker-guide.md#nodejs-version-policy) |
| Package manager | npm (npm workspaces for monorepos) |
| Framework | Fastify with `@fastify/type-provider-typebox` |
| Validation | TypeBox schemas on every route |
| Logging | pino (Fastify built-in) |
| Metrics/tracing | OpenTelemetry SDK + `@fastify/otel`, exported to SigNoz (self-hosted, OTel-native) |
| Config | `env-schema` + TypeBox |
| DB | Postgres via Drizzle ORM, drizzle-kit migrations — the single engine for every program (local via Docker Compose); `pgvector` for vector search |
| Jobs / scheduler | In-process only for disposable maintenance; durable queue such as pg-boss when work must survive restarts |
| API docs | `@fastify/swagger` + `@fastify/swagger-ui` |
| Testing | vitest + `app.inject()` |
| Lint/format | Biome |

Fastify is the TypeScript counterpart of the FastAPI conventions in the `python-building-fastapi-services` skill: schema-first validation on routes, plugin encapsulation, generated OpenAPI. The section structure below intentionally mirrors that guide.

## Project Structure

All source lives under `src/` — never at the backend root.

```text
backend/
  package.json
  tsconfig.json
  biome.json
  .env.example
  drizzle.config.ts          # Postgres projects
  src/
    app.ts                   # buildApp(): registers plugins + routes
    server.ts                # entry point: config, app, listen
    config/
      env.ts                 # env-schema definition + typed config
    routes/
      index.ts               # registers all route modules under /api/v1
      users.ts
      documents.ts
    services/
      user-service.ts
      document-service.ts
    platform/                 # optional: cross-module capability ports
      ports/
        mailer.ts
        object-store.ts
    adapters/                 # optional: production/local implementations
      mail/
      object-store/
    repositories/
      user-repo.ts
      document-repo.ts
    schemas/
      user.ts                # TypeBox schemas + Static<> types
      common.ts              # pagination, error envelope, id params
    jobs/
      index.ts               # scheduler + job registration
      reindex-documents.ts
    db/
      client.ts              # drizzle client factory
      schema.ts              # drizzle table definitions (Postgres)
      migrations/            # drizzle-kit generated migrations
    lib/
      errors.ts              # AppError hierarchy
  tests/
    routes/
    services/
```

`package.json` scripts: `dev` (tsx watch), `build` (tsc), `start`, `check` (tsc --noEmit), `test` (vitest), `lint` (biome check).

## App Bootstrap

Separate app construction from listening so tests can build the app without a port:

```typescript
// src/app.ts
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { AppConfig } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./lib/errors.js";

export function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: config.prettyLogs
      ? { transport: { target: "pino-pretty" } }
      : true,
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.setErrorHandler(errorHandler);
  app.get("/health", async () => ({ status: "ok" }));
  app.register(registerRoutes, { prefix: "/api/v1" });
  return app;
}
```

```typescript
// src/server.ts
import { loadConfig } from "./config/env.js";
import { buildApp } from "./app.js";

const config = loadConfig();
const app = buildApp(config);
await app.listen({ port: config.port, host: "0.0.0.0" });
```

## Route Patterns

Schema-first: every route declares TypeBox schemas for params, query, body, and response. Types are derived from schemas — never written twice.

```typescript
// src/schemas/user.ts
import { Type, type Static } from "@sinclair/typebox";

export const User = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
});
export type User = Static<typeof User>;

export const CreateUserBody = Type.Object({
  email: Type.String({ format: "email" }),
  name: Type.String({ minLength: 1 }),
});
export type CreateUserBody = Static<typeof CreateUserBody>;
```

```typescript
// src/routes/users.ts
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { User, CreateUserBody } from "../schemas/user.js";

export const userRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    "/users",
    {
      schema: {
        body: CreateUserBody,
        response: { 201: User },
      },
    },
    async (request, reply) => {
      const user = await app.userService.create(request.body);
      return reply.code(201).send(user);
    },
  );

  app.get(
    "/users/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String({ format: "uuid" }) }),
        response: { 200: User },
      },
    },
    async (request) => app.userService.getById(request.params.id),
  );
};
```

Conventions:

- All public endpoints live under `/api/v1/`; breaking changes go to `/api/v2/`, never in-place.
- Response schemas are mandatory — they document the contract and strip unlisted fields.
- Services and repositories return defined types (`Static<>` of a schema or an interface), never untyped objects or `any`.
- Follow `general-designing-apis` for naming, pagination, and error envelope conventions.

## Layering Rules

```text
routes (HTTP contract + validation)
  → services (business logic, transactions, authorization)
    → repositories (data access, SQL)
```

- Routes never touch repositories directly.
- Dependencies point inward only: no service imports a route, no repository imports a service.
- Wire services/repositories onto the app instance with a plugin and `decorate`, or pass them via a factory — pick one per project and record it in the dev spec.

The simple route → service → repository shape is the default for CRUD-oriented
services. When core logic coordinates replaceable infrastructure, use the
ports-and-adapters extension below rather than importing provider SDKs into
services.

## Ports and Adapters

Introduce a port when business logic depends on an external capability that
needs more than one implementation, must be isolated in tests, or is expected
to change independently: persistence, Git hosting, email, object storage,
payments, secret management, agent execution, or deployment.

```text
routes → services/application logic → capability ports
                                      ↑
                    adapters (Postgres, provider SDK, local/in-memory)
```

- Name a port after the capability (`Mailer`, `DeployProvider`, `Ledger`), not
  the vendor. Keep cross-module ports in `src/platform/ports/`; keep a
  feature-owned port beside that feature. Put implementations under
  `src/adapters/<capability>/`.
- Services depend only on port interfaces. Provider SDK imports, wire-format
  translation, retries, and provider error mapping stay in adapters.
- A repository is the persistence adapter for a domain port; the usual
  repository rules still apply. Do not add interfaces around stable internal
  functions merely to imitate the pattern.
- Provide a local or in-memory adapter when it enables deterministic service
  tests or a reachable local environment. Never select an in-memory/stub
  adapter in production for a capability whose state or side effects must
  survive restarts.
- Define one shared contract-test factory per port and run it against every
  adapter. A durable adapter's suite must exercise real migrations,
  constraints, and engine semantics; the fake alone is not evidence that the
  production adapter works.

## Error Handling

Define an error hierarchy with a base `AppError`; one `setErrorHandler` maps errors to HTTP responses. Never swallow an exception and print only a message — log the stack.

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export const errorHandler: FastifyInstance["errorHandler"] = (
  error,
  request,
  reply,
) => {
  if (error instanceof AppError) {
    request.log.warn({ err: error }, error.message);
    return reply
      .code(error.statusCode)
      .send({ error: { code: error.code, message: error.message } });
  }
  // Unexpected error: full stack to the log, opaque message to the client
  request.log.error({ err: error }, "unhandled error");
  return reply
    .code(500)
    .send({ error: { code: "INTERNAL", message: "Internal server error" } });
};
```

Services throw domain errors (`NotFoundError`, `ConflictError`); routes don't catch them — the error handler is the single mapping point.

## Logging

- pino via the Fastify built-in logger; structured JSON in production, `pino-pretty` in dev.
- Use `request.log` inside handlers so every line carries the request id; use `app.log` elsewhere.
- No `console.log` anywhere in `src/`.
- Log levels: `error` for failures needing attention, `warn` for expected domain errors, `info` for lifecycle events, `debug` for diagnostics.
- Full setup (request context, redaction, output destinations, dev pretty-printing): load the `typescript-implementing-logging` skill; policy in [observability](../../general-setting-up-observability/references/observability.md).

## Metrics and Tracing

- Instrument with the OpenTelemetry Node SDK (`@opentelemetry/sdk-node`,
  `@opentelemetry/auto-instrumentations-node`) — not `prom-client` or another
  vendor-specific client — so only the exporter changes if the backend
  changes.
- `@fastify/otel` (the official Fastify instrumentation) gives route-level
  spans automatically; register it before other plugins and routes.
- Export via OTLP to the service's chosen backend (default: SigNoz,
  self-hosted OTel-native all-in-one — see
  [observability](../../general-setting-up-observability/references/observability.md#backend)).
- Traces and metrics share the request id already on `request.log`, so an
  incident can move between a log line, a metric, and a trace for the same
  request without re-deriving correlation.

## Configuration

Validate the environment once at startup with `env-schema`; fail fast on missing or invalid values.

```typescript
// src/config/env.ts
import envSchema from "env-schema";
import { Type, type Static } from "@sinclair/typebox";

const ConfigSchema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  DATABASE_URL: Type.String(),
  SESSION_SECRET: Type.String({ minLength: 32 }),
  PRETTY_LOGS: Type.Boolean({ default: false }),
});

export type AppConfig = {
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  prettyLogs: boolean;
};

export function loadConfig(): AppConfig {
  const env = envSchema<Static<typeof ConfigSchema>>({
    schema: ConfigSchema,
    dotenv: true,
  });
  return {
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    prettyLogs: env.PRETTY_LOGS,
  };
}
```

- Secrets only via env: never committed, never logged. `.env` is gitignored;
  `.env.example` may include safe non-secret defaults, while secret keys have
  empty values plus provisioning notes.
- Secret fields have no working defaults in the shared schema. Tests and local
  development inject explicit non-production values; production fails startup
  when a secret is missing. See
  [configuration](../../general-managing-configuration/references/configuration.md).
- No `process.env` reads outside `src/config/`.

## Database Access

All SQL lives in `src/repositories/`. Choose the client by deployment model:

**Postgres (data-intensive / service programs)** — Drizzle ORM with drizzle-kit migrations:

```typescript
// src/repositories/user-repo.ts
import { eq, isNull, and } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users } from "../db/schema.js";

export function createUserRepo(db: Db) {
  return {
    async findById(id: string) {
      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt)));
      return rows[0] ?? null;
    },
    async softDelete(id: string) {
      await db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, id));
    },
  };
}
```

**Postgres is the only engine** — local tools and analytical jobs use the same
Docker Compose Postgres as the service (see
[data-and-analytics](../../general-instrumenting-product-analytics/references/data-and-analytics.md)); do not
introduce DuckDB or SQLite as a system of record.

Rules:

- Choose soft delete, archival, or hard delete per entity from recovery,
  retention, privacy, and erasure requirements. Document purge behavior.
- Transactions are owned by the service layer; repositories accept an optional transaction handle. No nested transactions.
- Migrations are forward-only and committed together with the code that needs them.
- IDs are UUIDv7; timestamps stored UTC, serialized ISO-8601.

## Background Jobs & Scheduling

Use a small in-process scheduler only for disposable, idempotent maintenance
work that can be lost and retried after a restart. Use a durable queue such as
pg-boss when completing the work is part of the product contract, when jobs
must survive restarts, or when more than one process can execute jobs.

Whatever the mechanism, every scheduled job must provide:

- a name and structured logging (job name + run id)
- a retry policy with backoff
- explicit dependencies (chain jobs in code; don't rely on timing)
- queryable status and enable/pause control (persist last-run results and enabled state)

Wrap timers or queue clients in a service so these guarantees live in one
place rather than scattered `setInterval` calls. Record the delivery and
durability decision in the dev spec.

## Security

- **Authentication**: select per client and document the full lifecycle using
  `docs/security/authentication.md` and
  `security-designing-authentication`.
- **Authorization**: use scoped permissions with explicit tenant/resource
  context; deny by default and enforce every access path using
  `docs/security/authorization.md`.
- **CSRF and sessions**: cookie-authenticated state changes require an explicit
  CSRF policy, server-side expiration, rotation, revocation, and logout.
- **CORS**: `@fastify/cors` with an explicit origin allowlist; no `*` in production.
- **Rate limiting**: `@fastify/rate-limit` on public endpoints.
- **Headers**: `@fastify/helmet`.
- **Dependency scanning**: `npm audit` in CI; Dependabot/Renovate for patches.
- **Audit logging**: auth events and destructive operations logged with actor and target.

## Inbound Webhook Verification

Webhook signatures cover the exact bytes sent by the provider, not the object
produced by `JSON.parse`. Preserve the raw body in an encapsulated route plugin
and keep the normal JSON parser everywhere else:

```typescript
// src/routes/provider-webhook.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
  }
}

export const providerWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.decorateRequest("rawBody");
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, rawBody, done) => {
      request.rawBody = rawBody;
      try {
        done(null, JSON.parse(rawBody));
      } catch (cause) {
        const error = new Error("Invalid JSON", { cause });
        Object.assign(error, { statusCode: 400 });
        done(error, undefined);
      }
    },
  );

  app.post("/webhooks/provider", async (request, reply) => {
    const rawBody = request.rawBody;
    const receivedHex = request.headers["x-provider-signature"];
    if (!rawBody || typeof receivedHex !== "string") {
      return reply.code(401).send({ error: { code: "INVALID_SIGNATURE" } });
    }

    const expected = createHmac("sha256", app.config.webhookSecret)
      .update(rawBody, "utf8")
      .digest();
    const received = Buffer.from(receivedHex, "hex");
    const valid =
      received.length === expected.length && timingSafeEqual(received, expected);
    if (!valid) {
      return reply.code(401).send({ error: { code: "INVALID_SIGNATURE" } });
    }

    await app.webhookService.accept(request.body);
    return reply.code(202).send({ accepted: true });
  });
};
```

Use the provider's maintained verifier when it supplies one; header format,
canonicalization, timestamp tolerance, and key rotation are provider-specific.
Use `parseAs: "buffer"` instead when the provider signs arbitrary bytes rather
than a specified UTF-8 payload. Register the parser and routes in the same
plugin scope so ordinary JSON routes retain Fastify's default parser and body
limit behavior.

After signature verification, deduplicate on the provider's immutable event or
message id with a durable unique constraint. Record the id and state change in
one transaction; return success for a duplicate already processed so provider
retries do not repeat the side effect. Tests cover the exact signed payload,
tampering, malformed signatures, stale timestamps when applicable, and repeat
delivery.

## Testing

vitest with Fastify's `inject` — no real port needed:

```typescript
// tests/routes/users.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { buildApp } from "../../src/app.js";
import { testConfig } from "../helpers.js";

describe("POST /api/v1/users", () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = buildApp(testConfig());
    await app.ready();
  });

  it("creates a user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/users",
      payload: { email: "a@example.com", name: "Ada" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().email).toBe("a@example.com");
  });

  it("rejects an invalid email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/users",
      payload: { email: "not-an-email", name: "Ada" },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- Route tests via `inject`; service tests with repository/port fakes;
  repository and durable-adapter tests against the real engine. Run each
  port's shared contract suite against every adapter, including the in-memory
  implementation and the durable implementation with real migrations.
- Follow `testing-typescript-applications` and
  `docs/quality/testing-strategy.md`; CI blocks merge on type-check, lint,
  relevant tests, generated-contract drift, and security checks.

## Summary Checklist

- [ ] All source under `src/`; routes → services → repositories layering respected
- [ ] External capabilities that need substitution use named ports, isolated adapters, and a shared contract suite
- [ ] Every route has TypeBox request and response schemas
- [ ] Public endpoints under `/api/v1/`
- [ ] `AppError` hierarchy + single `setErrorHandler`; stacks always logged
- [ ] pino logging with request ids; no `console.log`
- [ ] `env-schema` config, fail-fast startup, `.env.example` current
- [ ] Postgres via Drizzle; SQL only in repositories
- [ ] Retention/deletion policy selected per entity; forward-only migrations
- [ ] Jobs module with logging, retry, idempotency, status, and enable/pause; durable queue used when work must survive restarts
- [ ] Authentication lifecycle and CSRF policy documented; authorization denied by default and tested
- [ ] Webhooks verify the preserved raw body, compare signatures safely, and deduplicate on provider event id
- [ ] OpenAPI generated from route schemas; frontend transport types/client generated from it
- [ ] vitest + `inject` tests; CI runs check, lint, test, audit

## Primary References

- [Fastify content-type parsers](https://fastify.dev/docs/latest/Reference/ContentTypeParser/)
- [Fastify testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [@fastify/cookie](https://github.com/fastify/fastify-cookie)
- [Node.js `crypto.timingSafeEqual`](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
