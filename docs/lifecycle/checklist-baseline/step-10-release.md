# Baseline Checklist — Step 10: Cut the release

Gate (from app-building.md): Version and changelog agree with what merged.

Baseline items are the opinionated default for this step. When instantiated (see
`.agents/prompts/instantiate-lifecycle.md`) each is kept and either specialized
to the PRD (`PENDING`) or marked `N/A` with a PRD citation; a `must` item is
never silently dropped.

## release.version-bump — Version reflects what changed  [must]

- Invariant: The release version is bumped according to the nature of the change,
  and the tag matches the merged commit.
- Evidence required: The version tag and the commit it points at.
- Counterexample: A breaking change ships as a patch bump.
- Applies when: The step runs (produces a release).
- Status: PENDING

## release.changelog-agrees — Changelog matches the merged diff  [must]

- Invariant: The changelog entry describes what actually merged — no phantom
  entries, no omitted user-visible changes.
- Evidence required: The changelog entry cross-checked against the merged PRs.
- Counterexample: The changelog lists a feature that was cut before merge.
- Applies when: The step runs.
- Status: PENDING
