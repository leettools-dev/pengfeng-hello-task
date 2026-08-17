# Checklist — Step 04: Fix the engineering contract

Gate (from lifecycle): Every checklist item labeled Specification or Guidance
with a compliance degree; clarifications resolved, not guessed.

## spec.data-model — Data model covers every record type  [must]

- Invariant: The dev spec defines each stored record type with its fields, types,
  keys, and relationships, matching the record types the PRD names.
- Evidence required: `docs/dev-spec.md` data-model section; one entry per PRD
  record type.
- Counterexample: The PRD names a "vote" record the spec never models.
- Applies when: The product stores data.
- Applicability: PRD §Data and roles: "Records stored: none. No database, no
  session, no cookie, no user-generated content." PRD §Non-Goals: "Any database
  or persistence of any kind." §Technical Notes: "No database, no external
  API, no runtime secrets."
- Status: N/A — PRD §Data and roles: "Records stored: none. No database, no
  session, no cookie, no user-generated content."

## spec.api-contract.get-root — `GET /` has a typed contract  [must]

- Invariant: The dev spec declares `GET /`'s method, path, request shape (none),
  response shape (HTML, status 200, containing "Hello, Venture!"), and error
  responses — enough to implement and test without asking.
- Evidence required: An API contract entry for `GET /` with response schema and
  status codes.
- Counterexample: The spec says "serves the greeting" with no status code or
  content type.
- Applies when: The product exposes an API. Expand per route the PRD/spec
  names (this is `spec.api-contract` expanded per route).
- Applicability: PRD §Requirements: "One route (`/`) returning the greeting,
  plus a health endpoint for deploy checks. No other public routes." PRD
  §Acceptance Criteria 3: "`GET /` returns HTTP 200 and HTML containing the
  text 'Hello, Venture!'."
- Status: PENDING

## spec.api-contract.get-health — `GET /health` has a typed contract  [must]

- Invariant: The dev spec declares `GET /health`'s method, path, request shape
  (none), response shape (`{ "status": "ok" }`, status 200), and error
  responses.
- Evidence required: An API contract entry for `GET /health` with response
  schema and status codes.
- Counterexample: The spec says "health check" with no response body schema.
- Applies when: The product exposes an API. Expand per route the PRD/spec
  names (this is `spec.api-contract` expanded per route).
- Applicability: PRD §Requirements: "plus a health endpoint for deploy
  checks." PRD §Acceptance Criteria 2: "`GET /health` returns HTTP 200 with
  `{ \"status\": \"ok\" }`." Already implemented in
  `src/app/src/server.ts` with a TypeBox response schema — the dev spec still
  needs to document it as the binding contract.
- Status: PENDING

## spec.auth-baseline — Authentication approach is specified  [must]

- Invariant: The spec states how a caller proves identity (session, token, magic
  link, etc.), token/session lifetime, and what an unauthenticated request gets.
- Evidence required: An authentication section in the dev spec.
- Counterexample: Endpoints are "protected" with no stated mechanism.
- Applies when: The product has any authenticated user or protected route.
- Applicability: PRD §Data and roles: "No authentication, no authorization
  tiers." PRD §Non-Goals: "Accounts, sign-in, or user identity."
- Status: N/A — PRD §Data and roles: "No authentication, no authorization
  tiers."

## spec.authz-matrix — Authorization is defined per role  [must]

- Invariant: For each user role, the spec states which resources and actions it
  may and may not perform; deny is the default.
- Evidence required: An authorization matrix (role × action) in the dev spec.
- Counterexample: The spec has an "admin" role but never says what admin can do
  that a normal user cannot.
- Applies when: The product distinguishes more than one role or ownership.
  Expand per role the PRD names.
- Applicability: PRD §Data and roles: "Roles: one — anonymous visitor." Only
  one, undistinguished role — no per-role expansion is possible.
- Status: N/A — PRD §Data and roles: "Roles: one — anonymous visitor."

## spec.migrations-and-retention — Schema changes and retention are policy  [must]

- Invariant: Each schema change is expressed as a migration with a forward and a
  reverse path, and every record type has a stated retention/deletion policy.
- Evidence required: `design/schemas/` migration files; a retention statement per
  record type.
- Counterexample: A table stores personal data with no deletion policy, or a
  migration has no rollback.
- Applies when: The product stores data. Expand per table the spec defines.
- Applicability: Same finding as `spec.data-model` — no stored data, no tables
  to expand.
- Status: N/A — PRD §Data and roles: "Records stored: none."

## spec.config-secrets-boundary — Config and secrets are declared, not inlined  [must]

- Invariant: Every environment-specific value and secret the product needs is
  declared by name (with scope), read from configuration, and never hardcoded or
  committed.
- Evidence required: A config/secrets section listing each variable and its
  source; `.env.example` may give safe non-secret config defaults, while secret
  entries have empty values plus provisioning notes.
- Counterexample: A provider key appears literally in the spec or in code.
- Applies when: The product reads any environment config or secret.
- Applicability: `src/app/src/server.ts` reads `process.env.PORT` and
  `process.env.HOST`; `.env.example` declares `PORT`, `HOST`, `LOG_LEVEL` as
  non-secret runtime config. PRD §Technical Notes: "No database, no external
  API, no runtime secrets" — config exists (PORT/HOST/LOG_LEVEL), secrets do
  not.
- Status: PENDING

## spec.error-contract — Failure behavior is specified  [should]

- Invariant: The spec states, for each class of failure (validation, auth,
  not-found, upstream error), the status code and response shape the caller sees.
- Evidence required: An error-handling section mapping failure classes to
  responses.
- Counterexample: Only the happy path is specified; error shapes are left to
  chance.
- Applies when: The product exposes an API or user-facing surface.
- Applicability: PRD §Requirements names two routes (`/`, `/health`) and
  states "No other public routes" — the spec should state what an unmatched
  path returns (404).
- Status: PENDING

## spec.clarifications-resolved — No open questions left as guesses  [must]

- Invariant: Every clarification the PRD or spec surfaced is resolved with a
  recorded decision; nothing load-bearing is silently assumed.
- Evidence required: A resolved-questions list, or inline decisions, with no
  "TBD" on a launch-blocking point.
- Counterexample: The spec assumes one-vote-per-IP when the PRD never decided the
  dedup rule.
- Applies when: Always.
- Status: PENDING

## spec.items-labeled — Every spec item is labeled and graded  [must]

- Invariant: Each requirement in the dev spec is labeled Specification (binding)
  or Guidance (advisory) and carries a compliance degree.
- Evidence required: The dev spec's items each carry a label and a degree.
- Counterexample: A binding requirement is indistinguishable from a suggestion.
- Applies when: Always.
- Status: PENDING
