# PRD: Hello Task

A single static page that says "Hello, Venture!" — nothing else. This PRD
exists to exercise the Foreman delivery path as cheaply as possible: use it
when testing infrastructure (container lifecycle, close-policy mode, retries)
rather than product logic, where `../leet-dev-guides/tmp/hello-world.prd.md`'s
larger scope would waste real LLM turns on work that isn't what's being
tested.

Change the heading above (and nothing else) before each new test run — a
repeated name reuses the same local git repo and the same venture id from the
prior run instead of starting clean.

## Problem

Testing venture lifecycle changes (e.g. Foreman project vs. run-to-finish
close policy, retry/reattach behavior) needs a product that is real enough to
go through the full pipeline — provision, scaffold, build, verify, deploy —
but small enough that a run finishes in one or two cheap Pi turns.

## Users

- **Visitor (anonymous).** Opens the URL, sees the greeting. Nothing else.

## Primary flow

1. **Look.** Visitor opens the site. Within one second, "Hello, Venture!" is
   visible on the page.

## Requirements

- One route (`/`) returning the greeting, plus a health endpoint for deploy
  checks. No other public routes.
- No frontend framework needed — served HTML is enough.

## Data and roles

- **Roles:** one — anonymous visitor. No authentication, no authorization
  tiers.
- **Records stored:** none. No database, no session, no cookie, no
  user-generated content.

## Non-Goals

- Any database or persistence of any kind.
- Accounts, sign-in, or user identity.
- Analytics, tracking, cookies, or third-party scripts.
- Multiple languages, rotation, animation, or any interactivity.
- Real-time features, background jobs, email, or scheduled work.

## Acceptance Criteria

1. `npm test` passes and `npm run dev` serves the site locally.
2. `GET /health` returns HTTP 200 with `{ "status": "ok" }`.
3. `GET /` returns HTTP 200 and HTML containing the text "Hello, Venture!".

## Technical Notes

- Runtime: Node.js 24.
- Backend: Fastify with TypeScript — serves `/health` and the greeting.
- Tests: Vitest.
- No database, no external API, no runtime secrets.
