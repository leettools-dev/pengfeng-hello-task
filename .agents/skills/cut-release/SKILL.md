---
name: cut-release
description: "Cut and verify a versioned software release from a Git repository. Use when asked to cut, tag, publish, or ship a release; bump a package version; monitor a release workflow; or verify a package in its registry. Discover and follow the repository's own version, branch, tag, CI, and publishing contract instead of assuming one release layout."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Cut a Release

Release the exact repository state the user intends, wait for automation to
finish, and verify the published artifact. Treat tags and registry versions as
immutable.

## Safety Invariants

- Read repository instructions and release workflows before changing anything.
- Start from a clean worktree. Preserve unrelated or user-owned changes.
- Fetch the release remote and tags. Never reuse, delete, or force-move a
  shared release tag.
- Do not push a publishing tag until local verification and publishing
  credential preflight pass.
- Never print tokens or secret values. Checking whether a secret exists is
  sufficient.
- Do not claim success until the workflow reaches a successful terminal state
  and the external artifact can be fetched at the target version.

## 1. Discover the Release Contract

Inspect, in this order:

```bash
git status --short
git branch --show-current
git remote -v
git tag --list --sort=-version:refname
find .. -name AGENTS.md -print
find .github/workflows -maxdepth 1 -type f -print 2>/dev/null
```

Then read the applicable instructions, manifests, lockfiles, changelog, release
scripts, and workflows. Determine and record:

| Contract item | Examples |
|---|---|
| Version source | root `package.json`, workspace manifest, `pyproject.toml` |
| Release target | npm package, container, binary, application |
| Tag mapping | `v1.2.3`, `core-v1.2.3`, another documented pattern |
| Release commit | default branch, `dev`, rolling release branch |
| Publish trigger | tag push, GitHub Release, manual dispatch |
| Verification gate | test, build, pack, isolated install/import, smoke test |
| Credentials | repository secret, trusted publishing, registry login |
| Published proof | registry lookup, clean install, health check, checksum |

The workflow trigger and its tag-to-version validation are authoritative. Do
not impose `v*`, a release branch, a changelog, or npm publication on a repo
that defines something else.

## 2. Resolve the Target Version

Accept a user-supplied bare SemVer or derive an unambiguous target already
recorded in the version source.

- For a first release with no matching tags or registry version, the existing
  non-placeholder manifest version is the target unless the user specifies
  another one.
- If the manifest is ahead of the latest immutable tag and registry version,
  use the manifest version.
- Otherwise, determine the SemVer impact from changes since the previous tag:
  patch for compatible fixes, minor for compatible features, and major only
  for intentional breaking changes. Ask the user before choosing when more
  than one bump is defensible.

Validate that the target is forward from every existing matching tag and
published version. Confirm the exact tag is absent locally and remotely.

## 3. Preflight Remote Publication

Run read-only checks before creating release metadata:

```bash
git fetch origin --tags --prune
gh auth status
gh secret list
```

Use the actual remote name when it is not `origin`. Check the target registry
for both the latest version and the exact target. A registry `404` is expected
for an unpublished package; authentication and permission failures are not.

For a workflow that uses a repository secret such as `NPM_TOKEN`, require that
secret name to exist before pushing the tag. For trusted publishing, verify the
workflow has the required identity-token permission and that the registry-side
publisher is configured. If credentials or permissions cannot be verified,
stop before tagging and report the exact prerequisite.

For npm publication with `--provenance`, also check the GitHub repository's
visibility. npm rejects GitHub Actions provenance from private source
repositories even when the package is public. A private source repository must
publish without `--provenance` using its verified token or trusted-publisher
configuration.

Confirm the release commit contains all intended changes and is pushed to the
expected remote. Use `git pull --ff-only` on an existing shared release branch;
do not rebase or rewrite it.

## 4. Prepare Release Metadata

If the version source does not already equal the target, update it with the
repository's version command or script and regenerate dependent lockfile or
package metadata. Keep every manifest that CI compares in sync.

If the repository maintains a changelog, roll `Unreleased` to the target and
today's date, then add a fresh `Unreleased` section. Derive concise entries from
the diff and commits since the previous release. Do not invent a changelog for
a repository that intentionally has none.

Commit release metadata through the repository's normal protected-branch or PR
flow. If no metadata changes are needed, do not create an empty release commit.

## 5. Verify the Exact Artifact

Run the repository's complete release gate. At minimum:

1. Install from the lockfile using the project's clean-install command.
2. Run type checks, tests, and build scripts used by release CI.
3. Build the distributable artifact.
4. Test the artifact rather than only the source tree.

For an npm library, run `npm pack`, install the tarball into a temporary empty
consumer, and import or execute its public entry point. Inspect the pack list to
ensure declarations, runtime files, schemas, and other required assets are
included. For an app or container, exercise its documented health or smoke
path.

Stop on any failure. Fix and re-run the full relevant gate before tagging.

## 6. Tag and Publish

Create one annotated tag at the verified release commit using the discovered
tag pattern, then push only the required branch and tag:

```bash
git tag -a "$TAG" -m "$PROJECT $TAG" "$RELEASE_COMMIT"
git push origin "$TAG"
```

If the repository requires a rolling release branch, update it by fast-forward
or the documented merge strategy before tagging. If the branch has diverged,
stop rather than forcing it.

Locate the workflow run caused by this tag and watch it to completion. Confirm
the run's head SHA equals the tagged commit. If a credential or transient step
fails before publication, correct the prerequisite and rerun the same workflow
when safe. If the artifact itself is wrong, fix forward and cut a new patch;
never move the published tag.

## 7. Verify Externally

After CI succeeds:

- query the registry for the exact version;
- install or pull that exact immutable version in a clean temporary consumer;
- run the public import, CLI, health, or checksum smoke check;
- verify provenance or attestations when the workflow produces them;
- create a GitHub Release only when the repository contract requires one and
  doing so does not trigger an unintended second publication.

Report the version, tag, tagged commit, workflow result and URL, registry proof,
smoke-test result, and GitHub Release URL when one exists.

## Done When

- The version source, immutable tag, and published artifact agree.
- The tag points to the locally verified commit and exists on the remote.
- Release automation completed successfully for that commit.
- A clean external consumer can fetch and use the exact released version.
- The worktree is clean, or any remaining changes are explicitly identified.
