# Checklist — Step 02: Define the product

Gate (from lifecycle): Acceptance criteria are testable; non-goals are
explicit.

## prd.problem-and-users — Problem and users are named  [must]

- Invariant: The PRD states the problem, who has it, and the primary flows —
  concretely enough that a stranger could recognize the user.
- Evidence required: `docs/prd/<feature>.md` sections for problem, users, flows.
- Counterexample: The PRD lists features but never says whose problem they solve.
- Applies when: Always.
- Status: MET — `docs/prd/hello-task.md` §Problem ("Testing venture lifecycle
  changes ... needs a product that is real enough to go through the full
  pipeline ... but small enough that a run finishes in one or two cheap Pi
  turns"), §Users ("Visitor (anonymous). Opens the URL, sees the greeting.
  Nothing else."), §Primary flow ("1. Look. Visitor opens the site. Within one
  second, 'Hello, Venture!' is visible on the page.").

## prd.criteria-testable — Acceptance criteria are testable  [must]

- Invariant: Every acceptance criterion is phrased as an observable outcome a
  test or a person could check pass/fail, not a vague intention.
- Evidence required: An acceptance-criteria list where each item has a clear
  pass condition.
- Counterexample: "The app should feel fast" with no measurable bar.
- Applies when: Always.
- Status: MET — `docs/prd/hello-task.md` §Acceptance Criteria lists 3
  pass/fail-checkable criteria: (1) `npm test` passes and `npm run dev` serves
  the site locally, (2) `GET /health` returns HTTP 200 with `{ "status": "ok"
  }`, (3) `GET /` returns HTTP 200 and HTML containing "Hello, Venture!".

## prd.non-goals-explicit — Non-goals are stated  [must]

- Invariant: The PRD names what is deliberately out of scope for this release,
  so later steps can mark features `N/A` against a citation.
- Evidence required: An explicit non-goals section.
- Counterexample: Scope is defined only by omission, so every later step must
  guess whether something is excluded or just forgotten.
- Applies when: Always.
- Status: MET — `docs/prd/hello-task.md` §Non-Goals explicitly excludes:
  database/persistence, accounts/sign-in/identity, analytics/tracking/
  cookies/third-party scripts, multiple languages/rotation/animation/
  interactivity, and real-time/background jobs/email/scheduled work.

## prd.data-and-roles — Record types and user roles enumerated  [should]

- Invariant: The PRD names the record types the product stores and the distinct
  user roles, so downstream "per table / per role" checks have concrete entities.
- Evidence required: A data/roles list in the PRD.
- Counterexample: The data model is left entirely to the dev spec, so scope
  review cannot see it.
- Applies when: The product stores data or distinguishes user roles.
- Applicability: `docs/prd/hello-task.md` §Data and roles: "Roles: one —
  anonymous visitor. No authentication, no authorization tiers." and "Records
  stored: none. No database, no session, no cookie, no user-generated
  content." The product stores no data and has exactly one, undistinguished
  role — the condition is false even though the PRD happens to include a
  Data-and-roles section stating so.
- Status: N/A — PRD §Data and roles: "Records stored: none ... Roles: one —
  anonymous visitor."
