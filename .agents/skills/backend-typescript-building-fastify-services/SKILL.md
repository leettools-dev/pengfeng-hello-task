---
name: backend-typescript-building-fastify-services
description: "Build TypeScript backend services with Fastify using TypeBox schema-first routes, ports/adapters where justified, verified webhooks, generated OpenAPI contracts, pino, OpenTelemetry, validated config, workload-appropriate storage, jobs, security policy, and Vitest."
layer: lifecycle
applies_when:
  backend: [fastify]
peers:
  - general-instrumenting-product-analytics
  - general-managing-configuration
  - general-setting-up-observability
  - system-developing-with-docker
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Fastify Backend Development

## Overview

Use this skill when implementing TypeScript backend services on the recommended stack: Fastify on Node with npm. Storage is Postgres for every program — run locally via Docker Compose, with `pgvector` for vector search; no secondary engines.

Read [the canonical Fastify guide](references/fastify.dev.md)
for the full conventions. Load only the sections relevant to the current task
so the main skill stays small.

## Use This Skill When

- Creating a new backend service from a dev spec (see `dev-cycle-writing-dev-specs`)
- Adding or modifying routes, services, repositories, schemas, or jobs in an existing Fastify backend
- Wiring config, logging, error handling, auth, or database access
- Reviewing whether backend code follows the documented stack conventions

## Hard Rules

These come from the dev-spec checklist and are not stylistic preferences:

1. All source under `src/` — never at the backend root.
2. Default layering is routes → services → repositories. Replaceable external
   capabilities use inward-facing ports implemented by isolated adapters;
   routes never touch repositories/provider adapters and no imports point up.
3. Every route declares TypeBox request **and** response schemas; public endpoints under `/api/v1/`.
4. Services and repositories return defined types, never untyped objects.
5. pino for logging (no `console.log`); env via `env-schema` (no `process.env` reads outside `src/config/`).
6. Metrics and traces go through the OpenTelemetry SDK, never a vendor-specific client (e.g. `prom-client`) — the backend (default: SigNoz) is a config choice, not application code.
7. SQL lives only in repositories; migrations are forward-only; deletion and retention are selected per entity.
8. Scheduled work goes through a jobs module with logging, retry, idempotency, status, and enable/pause; use in-process scheduling only for disposable work and a durable queue when work must survive restarts.
9. Generate OpenAPI from route schemas and generate frontend transport types/client code from that contract.
10. Authentication and authorization follow the project dev spec and the `security-*` skills; deny by default and enforce permissions on every access path.
11. Inbound webhooks verify the preserved raw body before trusting parsed
    fields and deduplicate durably on the provider event id.

## Reference Map

- Stack and layout: `Stack`, `Project Structure`, `App Bootstrap`
- Endpoint work: `Route Patterns`, `Layering Rules`, `Ports and Adapters`
- Cross-cutting: `Error Handling`, `Logging`, `Metrics and Tracing`, `Configuration`
- Data work: `Database Access`, `Background Jobs`
- Hardening and verification: `Security`, `Inbound Webhook Verification`,
  `Testing`, `Summary Checklist`

If the task spans several areas, keep the reference open and pull in only the exact sections you need.
