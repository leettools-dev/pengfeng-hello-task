# Architecture

This file is the system-design narrative. After the spec workflow creates
`docs/dev-spec.md`, link to it here for enforceable rules instead of
duplicating the contract.

## System Shape

The starter project is a single Fastify application package under
`src/app/`; its package-local TypeScript source is under `src/app/src/`.
Replace or extend it as product requirements become clear.

## API Contract

The baseline exposes only the deploy health check. Product routes come from the
real PRD; the scaffold does not leave a public example route that every product
must remember to remove.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Local and deployment health check |

## Data Model

No persistent data is required for the baseline. Add schema notes and migrations
under `design/schemas/` when product features require storage.

## Architecture Decisions

### Decision: Start with Fastify and TypeScript

- Context: The default stack keeps backend contracts, tests, and clients in one
  TypeScript ecosystem.
- Chosen: Fastify with Vitest.
- Consequence: API tests can use Fastify injection without starting a network
  listener.
