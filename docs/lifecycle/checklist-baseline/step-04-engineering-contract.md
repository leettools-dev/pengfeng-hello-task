# Baseline Checklist — Step 04: Fix the engineering contract

Gate (from app-building.md): Every checklist item labeled Specification or
Guidance with a compliance degree; clarifications resolved, not guessed.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped. Items marked **per route / per table / per role** are
collections: expand them into one concrete sub-item for each entity the PRD or
dev spec names.

## spec.data-model — Data model covers every record type  [must]

- Invariant: The dev spec defines each stored record type with its fields, types,
  keys, and relationships, matching the record types the PRD names.
- Evidence required: `docs/dev-spec.md` data-model section; one entry per PRD
  record type.
- Counterexample: The PRD names a "vote" record the spec never models.
- Applies when: The product stores data.
- Status: PENDING

## spec.api-contract — Every route has a typed contract  [must]  (per route)

- Invariant: Each API route declares method, path, request shape, response
  shape, status codes, and error responses — enough to implement and test
  without asking.
- Evidence required: An API contract section listing one entry per route with
  request/response schemas.
- Counterexample: A route is described in prose with no response schema, so two
  implementers would disagree on the payload.
- Applies when: The product exposes an API. Expand per route the PRD/spec names.
- Status: PENDING

## spec.auth-baseline — Authentication approach is specified  [must]

- Invariant: The spec states how a caller proves identity (session, token, magic
  link, etc.), token/session lifetime, and what an unauthenticated request gets.
- Evidence required: An authentication section in the dev spec.
- Counterexample: Endpoints are "protected" with no stated mechanism.
- Applies when: The product has any authenticated user or protected route.
- Status: PENDING

## spec.authz-matrix — Authorization is defined per role  [must]  (per role)

- Invariant: For each user role, the spec states which resources and actions it
  may and may not perform; deny is the default.
- Evidence required: An authorization matrix (role × action) in the dev spec.
- Counterexample: The spec has an "admin" role but never says what admin can do
  that a normal user cannot.
- Applies when: The product distinguishes more than one role or ownership.
  Expand per role the PRD names.
- Status: PENDING

## spec.migrations-and-retention — Schema changes and retention are policy  [must]  (per table)

- Invariant: Each schema change is expressed as a migration with a forward and a
  reverse path, and every record type has a stated retention/deletion policy.
- Evidence required: `design/schemas/` migration files; a retention statement per
  record type.
- Counterexample: A table stores personal data with no deletion policy, or a
  migration has no rollback.
- Applies when: The product stores data. Expand per table the spec defines.
- Status: PENDING

## spec.config-secrets-boundary — Config and secrets are declared, not inlined  [must]

- Invariant: Every environment-specific value and secret the product needs is
  declared by name (with scope), read from configuration, and never hardcoded or
  committed.
- Evidence required: A config/secrets section listing each variable and its
  source; `.env.example` may give safe non-secret config defaults, while secret
  entries have empty values plus provisioning notes.
- Counterexample: A provider key appears literally in the spec or in code.
- Applies when: The product reads any environment config or secret.
- Status: PENDING

## spec.error-contract — Failure behavior is specified  [should]

- Invariant: The spec states, for each class of failure (validation, auth,
  not-found, upstream error), the status code and response shape the caller sees.
- Evidence required: An error-handling section mapping failure classes to
  responses.
- Counterexample: Only the happy path is specified; error shapes are left to
  chance.
- Applies when: The product exposes an API or user-facing surface.
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
