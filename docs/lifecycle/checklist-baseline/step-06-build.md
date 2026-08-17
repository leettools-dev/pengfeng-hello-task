# Baseline Checklist — Step 06: Build it

Gate (from app-building.md): Every plan task's verification command passes; spec
Progress Log current.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped. This step carries the **cross-cutting UI and product
standards** — each applies as its own item whenever its `Applies when` holds, so
"we forgot dark mode" is a visible `PENDING`, not an omission.

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
- Status: PENDING

## ui.theming.dark-light — Every screen renders in light and dark  [must]

- Invariant: Every screen renders correctly in both light and dark themes with no
  theme-locked colors; text stays legible in both.
- Evidence required: Paired light/dark captures of each screen.
- Counterexample: A card is white-on-white in dark mode because a color was
  hardcoded.
- Applies when: The product has any web or app UI.
- Status: PENDING

## ui.i18n.no-hardcoded-copy — User-facing copy is externalized  [should]

- Invariant: User-facing strings come from a single message source rather than
  being hardcoded inline, so locale and wording can change in one place.
- Evidence required: A message catalog; a screen rendered from it.
- Counterexample: A button label is a literal string buried in a component.
- Applies when: The PRD calls for localization or more than one locale; otherwise
  N/A with the citation.
- Status: PENDING

## ui.auth.sign-in-surface — Sign-in matches the specified method  [must]

- Invariant: The sign-in surface implements exactly the method the dev spec
  chose (e.g. Google sign-in, magic link), including the signed-out and
  error states.
- Evidence required: A captured sign-in flow; a test of the auth callback.
- Counterexample: The spec says magic link but the UI shows a password form.
- Applies when: The product has authenticated users.
- Status: PENDING

## ui.tables.conventions — Data tables sort, page, and handle empties  [should]  (per list)

- Invariant: Each list/table of records supports the conventions its data needs —
  sorting, pagination or virtualization for unbounded lists, and a defined empty
  state.
- Evidence required: The rendered table exercising sort/paging; the empty state.
- Counterexample: A list of votes renders all rows unpaged and shows a blank area
  when empty.
- Applies when: The product renders any list of records. Expand per list.
- Status: PENDING

## ui.states.loading-empty-error — Async surfaces show all three states  [must]  (per async view)

- Invariant: Every view that loads data has distinct loading, empty, and error
  states — never a blank screen or a spinner that never resolves on failure.
- Evidence required: Captures of all three states for each async view.
- Counterexample: A fetch failure leaves the page blank with no message.
- Applies when: The product has any UI that loads data asynchronously. Expand per
  async view.
- Status: PENDING

## ui.a11y.baseline — Interactive UI meets an accessibility baseline  [should]

- Invariant: Interactive elements are keyboard-reachable and labeled, and color
  contrast meets the baseline in both themes.
- Evidence required: An accessibility audit report with no critical violations.
- Counterexample: A modal cannot be closed with the keyboard.
- Applies when: The product has any web or app UI.
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
- Status: PENDING

## build.logging.structured — Feature code logs structured events, not console  [must]

- Invariant: Feature code emits structured log events through the logging
  facility; there is no `console.log` (or equivalent) left in shipped paths.
- Evidence required: A grep for stray console logging returns nothing in `src/`;
  sample structured log lines.
- Counterexample: Request handling logs via `console.log` with no correlation
  fields.
- Applies when: The product runs server or app code.
- Status: PENDING

## build.errors.handled — Errors surface with context, not swallowed  [must]

- Invariant: Errors are handled where they can be acted on and carry context;
  none are caught and silently discarded, and unexpected ones preserve the stack.
- Evidence required: Error-path tests; no empty `catch` that hides failures.
- Counterexample: A `catch` logs "error" and returns, dropping the stack trace.
- Applies when: The product runs server or app code.
- Status: PENDING

## build.secrets.not-committed — No secrets in the diff  [must]

- Invariant: The change introduces no hardcoded secret, key, or credential;
  secrets are read from configuration only.
- Evidence required: A secret scan of the diff returns clean.
- Counterexample: An API key is committed in a config file.
- Applies when: Always.
- Status: PENDING
