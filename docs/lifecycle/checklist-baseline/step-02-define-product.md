# Baseline Checklist — Step 02: Define the product

Gate (from app-building.md): Acceptance criteria are testable; non-goals are
explicit.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## prd.problem-and-users — Problem and users are named  [must]

- Invariant: The PRD states the problem, who has it, and the primary flows —
  concretely enough that a stranger could recognize the user.
- Evidence required: `docs/prd/<feature>.md` sections for problem, users, flows.
- Counterexample: The PRD lists features but never says whose problem they solve.
- Applies when: Always.
- Status: PENDING

## prd.criteria-testable — Acceptance criteria are testable  [must]

- Invariant: Every acceptance criterion is phrased as an observable outcome a
  test or a person could check pass/fail, not a vague intention.
- Evidence required: An acceptance-criteria list where each item has a clear
  pass condition.
- Counterexample: "The app should feel fast" with no measurable bar.
- Applies when: Always.
- Status: PENDING

## prd.non-goals-explicit — Non-goals are stated  [must]

- Invariant: The PRD names what is deliberately out of scope for this release,
  so later steps can mark features `N/A` against a citation.
- Evidence required: An explicit non-goals section.
- Counterexample: Scope is defined only by omission, so every later step must
  guess whether something is excluded or just forgotten.
- Applies when: Always.
- Status: PENDING

## prd.data-and-roles — Record types and user roles enumerated  [should]

- Invariant: The PRD names the record types the product stores and the distinct
  user roles, so downstream "per table / per role" checks have concrete entities.
- Evidence required: A data/roles list in the PRD.
- Counterexample: The data model is left entirely to the dev spec, so scope
  review cannot see it.
- Applies when: The product stores data or distinguishes user roles.
- Status: PENDING
