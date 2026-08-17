# Baseline Checklist — Step 00: Scaffold the repo

Gate (from app-building.md): `npm install && npm test && npm run dev` all pass.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## scaffold.baseline.green — Clean install, test, and dev all pass  [must]

- Invariant: On a fresh clone, `npm install && npm test && npm run dev` each exit
  0, and the hello-world endpoint responds locally.
- Evidence required: Terminal output of the three commands; a captured response
  from the running dev server.
- Counterexample: `npm test` passes but `npm run dev` fails to bind, or the app
  only runs after an undocumented manual step.
- Applies when: Always.
- Status: PENDING

## scaffold.baseline.layout — Repository contract layout present  [must]

- Invariant: The scaffold's required paths all exist (`check-scaffold` passes),
  including `docs/`, `design/`, `src/`, `tests/`, `deploy/`, `.agents/`.
- Evidence required: `node .agents/tools/check-scaffold.ts .` exits 0.
- Counterexample: A required directory is missing and CI would not have caught it.
- Applies when: Always.
- Status: PENDING

## scaffold.baseline.toolchain-lock — Toolchain versions pinned  [must]

- Invariant: `.agents/toolchain-lock.json` exists and pins the runtime and
  package-manager versions the repo builds against; regenerating the utility
  repo lock preserves that runtime block.
- Evidence required: The committed lock file; `toolchain-lock write` followed
  by `toolchain-lock verify`; a build resolving to the pinned versions.
- Counterexample: `toolchain-lock write` replaces the file with utility commits
  but silently drops the Node and package-manager pins.
- Applies when: Always.
- Status: PENDING

## scaffold.baseline.ci — CI runs the gate on every push  [must]

- Invariant: A CI workflow runs install, scaffold check, and the test suite on
  every branch push and PR, and its install/cache configuration agrees with the
  committed package-manager lockfile. When the repository plan supports
  required checks, branch protection blocks a failed or missing check. When it
  does not, the repository records that capability result and the merge
  authority must verify the head SHA's successful CI run before merging.
- Evidence required: The committed workflow and lockfile; the workflow's
  commands passing locally; a green CI run for the branch head; the branch
  protection capability probe and either its rule or the recorded fallback.
- Counterexample: CI enables npm caching or runs `npm ci` without a committed
  `package-lock.json`, or only runs after merge because pushes to feature
  branches do not trigger it.
- Applies when: Always.
- Status: PENDING

## scaffold.baseline.budget — Launch budget is propagated  [must]

- Invariant: `.agents/budgets.json` matches the launch configuration's venture
  ceilings, per scope and period.
- Evidence required: A non-secret equality check between the launch config and
  `.agents/budgets.json`.
- Counterexample: The venture config stops at $5,000 while the generated repo
  silently permits $50,000.
- Applies when: An agentic foreman or autonomous lifecycle drives the work.
- Status: PENDING

## scaffold.baseline.budget.metered — Declared ceilings are measured and enforced  [must]

- Invariant: A usage meter accumulates real consumption against the declared
  ceilings, and crossing the stop ceiling prevents another worker launch. A
  declared JSON file no process measures is not enforcement. Per-token
  enforcement is not required: a supervisor that accumulates reported usage
  across invocations and refuses to assign the next one satisfies this.
- Evidence required: The capability record's `budget-meter` probe, produced by
  the read-only capability preflight — the meter usually lives on the
  supervisor, outside the workspace, so this is a probe result supplied by the
  environment, not a reading an invocation pastes. Where the probe reports
  `available`, its recorded output plus the launch configuration's stop
  behavior.
- Counterexample: Agents merely promise to "watch" a file no process measures.
- Counterexample: The item sits `PENDING` to the completion gate because no
  invocation can reach a meter that was never reachable from this workspace.
- Applies when: An agentic foreman or autonomous lifecycle drives the work.
  Resolve `N/A — capability:budget-meter unavailable …` when the record says so,
  and record the unmetered run as debt.
- Status: PENDING

## scaffold.environments-declared — The venture's environment set is a recorded decision  [must]

- Invariant: Which environments this venture has is decided and recorded before
  build work — each declared environment with its deploy target, domain, the
  read-only preflight that proves the target is reachable, and the environment
  variables it consumes by name. No environment is left undecided. A
  production-only venture is a legitimate posture; an unstated one is not.
- Evidence required: The environments record with no undecided entry, plus the
  capability record's `environment-set` and `deploy-target` probes over it.
- Counterexample: Every scaffold ships a `deploy/staging/` directory, so an
  agent infers staging is expected, finds no target at deploy time, and has no
  sanctioned way to record that this venture is production-only.
- Counterexample: An environment is declared with a credential-shaped value but
  no preflight, so "reachable" was never tested.
- Applies when: Always.
- Status: PENDING

## scaffold.external-capability-preflight — Later external capabilities probed early  [must]

- Invariant: Before substantial build work, every external capability an
  applying later step consumes has been probed read-only and the verdict
  recorded in a machine-readable capability record that later steps resolve
  against. A probe proves the exact account, target, and required permissions —
  not just that a credential-shaped value exists — and mutates nothing. Every
  credential a later step consumes is one the environment supplies, including
  the SSH keypair used to reach VMs a deploy provisions, which is passed in and
  never generated by the scaffold, the harness, or the deploy run. The record
  covers every capability class the applying steps need — git hosting, deploy
  target, environment set, budget meter, telemetry sink, analytics sink — and
  each entry names the checklist items it unblocks, so no later step can walk
  into an unprobed capability.
- Evidence required: The capability preflight's own captured output and the
  record it wrote, with a verdict for every class above: `available`,
  `unavailable`, `not-applicable`, or `unprobed`. Credential variables appear by
  name, never by value. An `unavailable` capability is recorded as an explicit
  blocker and resolves the items it unblocks at instantiation rather than at the
  gate. For a VM-provisioning deploy target, the recorded preflight output shows
  both injected SSH key variables (for `leet-deploy`,
  `LEET_DEPLOY_EDGE_SSH_PRIVATE_KEY` and `LEET_DEPLOY_EDGE_SSH_PUBLIC_KEY`,
  which hold the key values themselves, not paths to key files) present and
  usable.
- Counterexample: A deploy credential is present at bootstrap, but only after
  the product is finished does the team discover it cannot create the required
  service account or edit the target DNS zone.
- Counterexample: The item is marked `MET` on a deploy preflight alone, and four
  unprobed capabilities — meter, telemetry, analytics, environment set — surface
  one at a time at steps 09, 11, and 13, after the product is built, reviewed,
  released, and deployed.
- Counterexample: Nobody checks for an SSH key at bootstrap; at deploy time an
  agent runs `ssh-keygen`, creating a keypair that no VM trusts, no operator can
  rotate, and the next invocation does not have.
- Applies when: Always. Every lifecycle has later steps that consume something
  outside the repository; a venture that consumes none records that as the
  probe's own `not-applicable` verdict.
- Status: PENDING
