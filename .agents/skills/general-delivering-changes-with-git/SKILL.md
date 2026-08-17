---
name: general-delivering-changes-with-git
description: "Preserve recovered branch work and deliver repository changes as clean, reviewable, CI-ready commits. Use whenever a coding harness edits a Git checkout, resumes a failed phase, prepares work for an orchestrator-managed pull request, or must reconcile package-manager lockfiles with CI configuration."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Delivering Changes with Git

## Overview

Treat the Git branch as durable work, not scratch space. Preserve earlier
commits, make the repository's declared checks pass locally, commit everything
needed to reproduce them, and leave remote PR and merge operations to the
authority that launched the harness unless the task explicitly assigns them.

## Establish the Delivery Boundary

Before editing:

1. Run `git status --short --branch`, `git log --oneline -10`, and inspect the
   current branch.
2. Treat existing branch commits and files as recovered work. Continue from
   them; do not reset, force-push, delete, or recreate them.
3. Determine who owns remote operations. When a foreman or service says it will
   publish, open, approve, or merge the PR, do not run those operations
   yourself. Your boundary is a clean committed local branch.
4. Stop if the checkout is on the wrong branch, contains an unresolved merge,
   or would require discarding work. Report the exact state instead of choosing
   a destructive recovery.

## Make Dependency State Reproducible

Inspect `package.json`, the package-manager declaration, lockfiles, and CI
workflows together. They are one contract.

- Use the repository's declared package manager; never introduce a second one.
- If CI uses dependency caching or a frozen install (`npm ci`,
  `pnpm --frozen-lockfile`, `yarn --immutable`), ensure its matching lockfile is
  present and committed.
- For npm, run `npm install` when `package-lock.json` is absent. This both
  verifies dependency resolution and creates the lockfile CI caching requires.
  Use `npm ci` once the lockfile exists.
- Commit a manifest and its lockfile together. Never delete the lockfile or
  weaken CI merely to make setup pass.
- If dependency resolution changes the lockfile unexpectedly, inspect and
  explain the diff before committing it.

## Reproduce CI Before Handoff

Read the workflows under `.github/workflows/` and run their meaningful commands
locally in the same order. At minimum:

- install dependencies with the workflow-compatible command
- run repository/scaffold and lifecycle structural checks
- run tests, typecheck, lint, and build when those scripts exist or CI invokes
  them

A documentation-only phase does not excuse a broken repository baseline. If the
workflow would fail because a required generated input such as a lockfile is
missing, fix and commit that input as part of the branch.

Do not claim CI is green before GitHub reports it. Local parity proves the
branch is ready to be checked; the remote check remains the merge gate.

## Commit and Handoff

1. Group changes into logical commits. Include recovered work; do not rewrite
   its history.
2. Use an imperative message that names the product outcome or PRD section.
3. Run the local CI-parity commands after the final commit.
4. Run `git status --short`; the handoff requires a clean tree.
5. Report the branch, commits created, commands run with their results, and any
   check that could not be reproduced.

If a command fails, keep completed work committed and report the exact command
and failure. Do not mark the phase complete, open an empty PR, approve your own
work, bypass branch protection, or attempt a merge while required checks are
pending or failing.

## Checklist

- [ ] Existing branch commits and uncommitted work were preserved
- [ ] Package manager, manifest, lockfile, and CI configuration agree
- [ ] CI-equivalent commands passed locally and their output was recorded
- [ ] All intended changes, including generated lockfiles, are committed
- [ ] Working tree is clean
- [ ] Remote PR/merge operations remain with their assigned authority
