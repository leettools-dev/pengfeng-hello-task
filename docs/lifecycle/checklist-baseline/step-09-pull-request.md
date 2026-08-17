# Baseline Checklist — Step 09: Open the PR

Gate (from app-building.md): CI green; a reviewer other than the author has
approved — a separate review agent counts, "no reviewer" never does.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

**Who authors the PR body.** The party that opens the pull request writes its
body, and that party is whoever satisfies `pr.description`. Under a supervised
harness this is the working agent itself: it pushes its branch and opens or
updates the PR, so the required sections exist and the item is verifiable
against the body it wrote. A platform that opens the PR from a machine-composed
summary does not satisfy the item — a changed-file count and a readiness line
are not a summary, a change list, and a test plan — so where the platform owns
PR creation, the agent authors the body into the workspace file the platform
consumes, and that file is the evidence. Merging remains a separate authority's
decision in either arrangement.

## pr.description — PR states summary, changes, and test plan  [must]

- Invariant: The PR description says what changed, why, and how it was tested,
  and links the PRD/spec it satisfies.
- Evidence required: The PR body as it exists on the host, read back from the
  host rather than asserted — or, where the platform opens the PR, the workspace
  file the agent authored for it. Either way the body carries summary, changes,
  and test-plan sections and the PRD/spec link.
- Counterexample: The PR body is a single line with no test plan.
- Counterexample: The body is machine-composed from an outcome summary and a
  changed-file count, so the required sections cannot exist no matter how well
  the work was done.
- Applies when: The capability record shows reachable git hosting. A repository
  whose only remote is a local path resolves this
  `N/A — capability:git-hosting unavailable …`; it never invents a pull request.
- Status: PENDING

## pr.ci-green — CI passes on the PR  [must]

- Invariant: All required CI checks pass on the PR head before merge.
- Evidence required: The host's own report of check status for the PR head SHA,
  captured as command output — not a local test run standing in for CI, and not
  a claim that CI "should" pass.
- Counterexample: A required check is failing but the PR is merged anyway.
- Counterexample: The local suite is green and cited as CI evidence while the
  hosted run never completed.
- Applies when: The capability record shows reachable git hosting and the
  repository has a CI workflow.
- Status: PENDING

## pr.independent-approval — A non-author reviewer approved  [must]

- Invariant: Someone other than the author reviewed and approved; a separate
  review agent counts, an unreviewed merge never does.
- Evidence required: The recorded approval read back from the host, naming the
  reviewer identity. When the reviewer is a service or review agent rather than
  a human, that identity is what the evidence names, and it must be distinct
  from the identity that authored the change — a distinct reviewer is the whole
  invariant, not the reviewer's species.
- Counterexample: The author merges their own PR with no other approval.
- Counterexample: The implementing agent records its own re-read of the diff as
  the independent approval.
- Applies when: The capability record shows reachable git hosting.
- Status: PENDING

## pr.scope-matches — The diff matches the stated scope  [should]

- Invariant: The PR contains only the change it describes; unrelated edits are
  split out.
- Evidence required: A diff whose files map to the described change.
- Counterexample: A one-line fix PR also reformats twenty unrelated files.
- Applies when: Always.
- Status: PENDING
