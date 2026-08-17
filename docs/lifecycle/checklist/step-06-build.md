# Checklist — Step 06: Build it

Gate (from lifecycle): Every plan task's verification command passes; spec
Progress Log current.

## build.tasks-verified — Every plan task's verification command passes  [must]

- Invariant: Each task in the implementation plan has been run and its stated
  verification command exits 0 on the branch.
- Evidence required: The verification command output per task, or a CI run
  covering them.
- Counterexample: A task is marked done but its command was never run.
- Applies when: Always.
- Status: PENDING

## build.progress-log — Dev-spec Progress Log is current  [must]

- Invariant: `docs/dev-spec.md` Progress Log reflects what was actually built,
  including deviations from the plan and why.
- Evidence required: An up-to-date Progress Log entry for this change.
- Counterexample: The log still says "not started" for shipped code.
- Applies when: Always.
- Status: PENDING

## build.preview-deployed-early — First runnable UI is deployed early  [must]

- Invariant: As soon as the product can boot in its target environment and render
  a meaningful user-facing screen, that increment is deployed to staging or a
  persistent preview environment.
- Evidence required: The deployment record, reachable URL, and a captured smoke
  check of the rendered UI.
- Counterexample: The product remains local until it is feature-complete or ready
  for production release.
- Applies when: The product has a web or app UI and a remote deployment target.
- Applicability: PRD §Primary flow: visitor opens the site and sees "Hello,
  Venture!" rendered in a browser — a (minimal) web UI. Capability record:
  `deploy-target` `available` (`leet-deploy`,
  `hello-task.pengfeng.leettools.ai`). No staging environment is declared
  (`.agents/environments.json`), so "early" here means the production-shaped
  local rehearsal (`deploy.prerelease-rehearsal`, step 11) doubles as the early
  preview since there is no separate persistent preview target.
- Status: PENDING

## ui.theming.dark-light — Every screen renders in light and dark  [must]

- Invariant: The `GET /` greeting page renders correctly in both light and dark
  browser/OS themes with no theme-locked colors; the "Hello, Venture!" text
  stays legible in both.
- Evidence required: Paired light/dark captures of `GET /`.
- Counterexample: The page hardcodes a light background and dark text with no
  `color-scheme` declaration, so it stays white-on-near-white in a dark-themed
  browser reader mode, or a hardcoded dark background makes default black text
  illegible.
- Applies when: The product has any web or app UI.
- Applicability: PRD §Primary flow describes a visitor viewing a rendered page
  — a web UI, even though PRD §Requirements says "No frontend framework
  needed — served HTML is enough." The clause is about the presence of any UI,
  not its complexity.
- Status: PENDING

## ui.i18n.no-hardcoded-copy — User-facing copy is externalized  [should]

- Invariant: User-facing strings come from a single message source rather than
  being hardcoded inline, so locale and wording can change in one place.
- Evidence required: A message catalog; a screen rendered from it.
- Counterexample: A button label is a literal string buried in a component.
- Applies when: The PRD calls for localization or more than one locale; otherwise
  N/A with the citation.
- Applicability: PRD §Non-Goals: "Multiple languages, rotation, animation, or
  any interactivity."
- Status: N/A — PRD §Non-Goals: "Multiple languages ... " explicitly excluded.

## ui.auth.sign-in-surface — Sign-in matches the specified method  [must]

- Invariant: The sign-in surface implements exactly the method the dev spec
  chose (e.g. Google sign-in, magic link), including the signed-out and
  error states.
- Evidence required: A captured sign-in flow; a test of the auth callback.
- Counterexample: The spec says magic link but the UI shows a password form.
- Applies when: The product has authenticated users.
- Applicability: PRD §Data and roles: "No authentication, no authorization
  tiers." PRD §Non-Goals: "Accounts, sign-in, or user identity."
- Status: N/A — PRD §Non-Goals: "Accounts, sign-in, or user identity."

## ui.tables.conventions — Data tables sort, page, and handle empties  [should]

- Invariant: Each list/table of records supports the conventions its data needs —
  sorting, pagination or virtualization for unbounded lists, and a defined empty
  state.
- Evidence required: The rendered table exercising sort/paging; the empty state.
- Counterexample: A list of votes renders all rows unpaged and shows a blank area
  when empty.
- Applies when: The product renders any list of records. Expand per list.
- Applicability: PRD §Data and roles: "Records stored: none." No lists of
  records exist or are rendered.
- Status: N/A — PRD §Data and roles: "Records stored: none ... no
  user-generated content."

## ui.states.loading-empty-error — Async surfaces show all three states  [must]

- Invariant: Every view that loads data has distinct loading, empty, and error
  states — never a blank screen or a spinner that never resolves on failure.
- Evidence required: Captures of all three states for each async view.
- Counterexample: A fetch failure leaves the page blank with no message.
- Applies when: The product has any UI that loads data asynchronously. Expand
  per async view.
- Applicability: PRD §Requirements: "No frontend framework needed — served
  HTML is enough." The page is fully server-rendered on each request; there is
  no client-side async data fetch to show loading/empty/error states for.
- Status: N/A — PRD §Requirements: "served HTML is enough" (no client-side
  async data loading).

## ui.a11y.baseline — Interactive UI meets an accessibility baseline  [should]

- Invariant: Interactive elements are keyboard-reachable and labeled, and color
  contrast meets the baseline in both themes.
- Evidence required: An accessibility audit report with no critical violations.
- Counterexample: A modal cannot be closed with the keyboard.
- Applies when: The product has any web or app UI.
- Applicability: Same finding as `ui.theming.dark-light` — a (minimal,
  non-interactive) web UI exists. PRD §Non-Goals excludes interactivity
  ("any interactivity"), so there are no interactive elements to audit for
  keyboard reachability; the applicable baseline narrows to text color
  contrast.
- Status: PENDING

## ai.surface.guardrails — AI/conversational surfaces have guardrails  [must]

- Invariant: Any AI/conversational surface handles empty input, model/tool
  errors, and streaming interruptions, and does not expose raw provider errors or
  secrets to the user.
- Evidence required: Tests of the error/interrupt paths; a captured failure that
  degrades gracefully.
- Counterexample: A model timeout surfaces a raw stack trace to the end user.
- Applies when: The PRD describes any AI or conversational feature; otherwise N/A
  with the citation.
- Applicability: `docs/prd/hello-task.md` names no AI or conversational
  feature anywhere (§Requirements, §Primary flow, §Non-Goals).
- Status: N/A — PRD names no AI or conversational feature.

## build.logging.structured — Feature code logs structured events, not console  [must]

- Invariant: Feature code emits structured log events through the logging
  facility; there is no `console.log` (or equivalent) left in shipped paths.
- Evidence required: A grep for stray console logging returns nothing in `src/`;
  sample structured log lines.
- Counterexample: Request handling logs via `console.log` with no correlation
  fields.
- Applies when: The product runs server or app code.
- Applicability: `src/app/src/server.ts` runs a Fastify server (already uses
  `Fastify({ logger: true })`, i.e. pino, not `console.log`).
- Status: PENDING

## build.errors.handled — Errors surface with context, not swallowed  [must]

- Invariant: Errors are handled where they can be acted on and carry context;
  none are caught and silently discarded, and unexpected ones preserve the stack.
- Evidence required: Error-path tests; no empty `catch` that hides failures.
- Counterexample: A `catch` logs "error" and returns, dropping the stack trace.
- Applies when: The product runs server or app code.
- Applicability: `src/app/src/server.ts` runs a Fastify server. The current
  `.listen()` error path logs via `app.log.error(error)` and exits — this
  needs to be verified for the new `/` route too once implemented.
- Status: PENDING

## build.secrets.not-committed — No secrets in the diff  [must]

- Invariant: The change introduces no hardcoded secret, key, or credential;
  secrets are read from configuration only.
- Evidence required: A secret scan of the diff returns clean.
- Counterexample: An API key is committed in a config file.
- Applies when: Always.
- Status: PENDING
