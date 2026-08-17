# Checklist — Step 08: Review before asking others

Gate (from lifecycle): Self-review done; no unexplained deviation from
`docs/dev-spec.md`.

## review.self-done — A code review ran and findings are addressed  [must]

- Invariant: The change has been reviewed for correctness and clarity, and each
  finding is either fixed or recorded with a reason to defer.
- Evidence required: Review findings with a resolution against each.
- Counterexample: The PR opens with known issues nobody noted.
- Counterexample: Known dead code is left in with no note.
- Applies when: Always.
- Status: MET — Self-review of `git diff main...HEAD -- src/ tests/
  package.json .github/workflows/ci.yml` performed this invocation. Findings:
  (1) the four test files imported `../../src/app/src/server` without a
  `.js` extension, which `tsc --noEmit` rejects under `moduleResolution:
  NodeNext` — fixed by adding the extension to all four, and by adding a
  `check` script + CI step so this class of break is caught going forward
  (this was true of the pre-existing `health.test.ts` too, not only the new
  files). (2) No dead code, no empty `catch`, no leftover debug logging
  found. (3) The `/` handler has no error path to test (constant string, no
  I/O) — confirmed intentional, not an oversight, and recorded as such in
  `docs/dev-spec.md` §3.3.3.

## review.simplify — A simplification pass ran  [should]

- Invariant: The change was checked for duplication, needless complexity, and
  reuse of existing utilities, and reducible complexity was reduced.
- Evidence required: Simplification findings addressed, or a note that none
  applied.
- Counterexample: The diff reimplements a helper that already exists.
- Applies when: Always.
- Status: MET — Checked for duplication and needless complexity: the `/`
  handler is a single `reply.type().send()` call reusing Fastify's own reply
  API (no hand-rolled HTML templating for one static string); `buildServer()`
  is reused by all three test levels rather than each test standing up its
  own server construction; no new abstraction (service/repository layer) was
  added for two routes with no shared logic, matching the deviation already
  recorded in `docs/dev-spec.md` §3.2.1. Nothing found to simplify further.

## review.spec-conformance — No unexplained deviation from the dev spec  [must]

- Invariant: The implementation matches `docs/dev-spec.md`; any deviation is
  recorded with a reason, not left silent.
- Evidence required: A deviation list (possibly empty) reconciled against the spec.
- Counterexample: The API returns a different shape than the spec's contract with
  no explanation.
- Applies when: A dev spec exists for the change.
- Applicability: Step 4 (not skippable) produces `docs/dev-spec.md` before step
  8 runs, so a dev spec will exist to check conformance against by the time
  this item is evaluated.
- Status: MET — Reconciled the implementation against `docs/dev-spec.md` §6
  API Contract and §3: `GET /` returns `200`/`text/html`/"Hello, Venture!" as
  specified; `GET /health` unchanged; unmatched routes return Fastify's
  documented default 404 shape; `LOG_LEVEL` is read as specified in §3.3.5.
  One addition beyond the original spec text, made during implementation and
  now reflected back into the spec: the `color-scheme` meta tag (needed to
  satisfy `ui.theming.dark-light`, step 06) — not a deviation from a stated
  rule, an elaboration of "renders as HTML" that the spec's Architecture
  Decision already anticipated. No other deviation found.

## review.frontend-audit — UI changes pass a frontend audit  [should]

- Invariant: UI changes were audited for the cross-cutting standards (theming,
  states, accessibility) before review by others.
- Evidence required: A frontend audit result with issues addressed.
- Counterexample: A new screen ships without its dark-mode or error state, caught
  only after merge.
- Applies when: The change touches UI.
- Applicability: The change adds/changes `GET /`'s rendered HTML — the same
  minimal web UI referenced in `ui.theming.dark-light` (step 06).
- Status: MET — Frontend audit performed against the cross-cutting standards
  this UI is subject to: theming (`ui.theming.dark-light`, step 06 — MET with
  a recorded evidence gap: `color-scheme` declared, zero hardcoded colors, no
  headless browser available in this container to capture a screenshot),
  accessibility (`ui.a11y.baseline`, step 06 — MET: no interactive elements,
  UA-default contrast far exceeds WCAG AA), states/i18n/tables/auth surfaces
  (all `N/A` per PRD non-goals, step 06). No new issue found beyond the two
  already-recorded evidence gaps, which are tooling limitations of this
  container, not defects in the page.
