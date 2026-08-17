# Checklist — Step 10: Cut the release

Gate (from lifecycle): Version and changelog agree with what merged.

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
- Note: `gtm/marketing/release-notes.md` already has an "## Unreleased"
  section ("Added the hello-world scaffold baseline.") — a hello-task-specific
  entry needs to be added and reconciled at release time.
