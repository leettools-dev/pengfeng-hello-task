# Architecture — Hello Task

This is the system-design narrative. For enforceable rules (labeled
Specification/Guidance with a compliance degree), see
[`docs/dev-spec.md`](../docs/dev-spec.md) — this file does not duplicate that
contract.

## System Shape

One Fastify application package under `src/app/`, TypeScript source under
`src/app/src/server.ts`. A single process serves two routes and nothing else:
no database, no background job, no second service. `buildServer()` is
exported so tests exercise the real Fastify instance via `.inject()` (unit
level) or a real listening socket (e2e level) without duplicating route
wiring.

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Local and deployment health check |
| GET | `/` | Primary flow "Look" — returns HTML containing "Hello, Venture!" |

See `docs/dev-spec.md` §6 for the full contract (status codes, response
shapes, the 404 fallback).

## Data Model

None. No persistent data (PRD §Data and roles: "Records stored: none").
`design/schemas/` stays empty; nothing here to migrate.

## Deployment Topology

- **Local rehearsal:** `deploy/local/docker-compose.yml` runs the same
  container image Node 24 major version as production, no separate staging
  environment declared (`.agents/environments.json`) — this is the
  production-shaped rehearsal step 11 runs before the production apply.
- **Production:** `hello-task.pengfeng.leettools.ai` via `leet-deploy`
  (`.agents/toolchain.json`), which provisions the VM, reverse proxy, and TLS
  certificate (`leet-ssl-cert`). One environment, no blue/green — rollback is
  redeploying the previous image (`deploy/production/README.md`).

```
Browser ──HTTPS──▶ leet-deploy edge (TLS, reverse proxy)
                         │
                         ▼
                 Fastify process (this repo)
                 GET /        → "Hello, Venture!" HTML
                 GET /health  → { "status": "ok" }
```

## Architecture Decisions

### Decision: Start with Fastify and TypeScript

- Context: The default stack keeps backend contracts, tests, and clients in one
  TypeScript ecosystem.
- Chosen: Fastify with Vitest.
- Consequence: API tests can use Fastify injection without starting a network
  listener.

### Decision: No frontend framework, no database, no auth

- Context: PRD §Requirements/§Non-Goals explicitly rule out a frontend
  framework, persistence, and accounts/identity for this product.
- Chosen: Serve `/` as a plain HTML string from the Fastify handler; no
  storage layer, no auth layer.
- Consequence: See `docs/dev-spec.md` §2 for the full rationale and which
  spec sections this forecloses.
