# API Contracts and Shared Types

The browser, backend, VS Code webview, and mobile clients must agree on the
same wire contract. Sharing a language does not by itself prevent drift:
duplicated TypeScript interfaces can still disagree at runtime.

## Default Contract Pipeline

For the Fastify stack, TypeBox route schemas are the source of truth:

```text
TypeBox request/response schemas
            |
            v
Fastify route validation and serialization
            |
            v
Generated OpenAPI document
            |
            v
Generated TypeScript client and transport types
            |
            v
React, VS Code webview, and React Native consumers
```

Rules:

1. Define request and response schemas once, next to the backend domain.
2. Register every public schema with the route so OpenAPI includes it.
3. Generate client types from OpenAPI in CI or during the build.
4. Do not hand-write a second interface for an API payload.
5. Fail CI when generated output differs from committed output, if generated
   files are committed.
6. Validate data again at non-HTTP trust boundaries such as local storage,
   extension messages, queues, webhooks, and third-party APIs.

Zod remains appropriate for frontend-only forms and local persisted state.
Do not describe a Zod form schema as the shared API contract unless the
project explicitly selects a Zod-first backend contract and records that as
an Architecture Decision.

## Contract Compatibility

- Additive optional response fields are normally backward compatible.
- Removing or renaming a field is breaking.
- Making an optional input required is breaking.
- Changing meaning without changing shape is breaking.
- Consumers must tolerate unknown response fields.
- Breaking public contracts require a versioning or coordinated migration
  plan; do not create `/v2` merely because an internal implementation changed.

## Required Verification

- Route tests prove runtime validation and serialization.
- A generated-client check proves the OpenAPI document is consumable.
- Type tests prove important client methods expose the intended types.
- At least one integration test crosses the real client/server serialization
  boundary for each critical domain.
