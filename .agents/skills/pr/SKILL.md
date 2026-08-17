---
name: pr
description: "Create a pull request from the current branch with a conventional-prefix title, a generated summary/changes/test-plan body, and an automatic Copilot review request. Invoke as /pr or by asking to \"create a pull request\"."
disable-model-invocation: true
layer: lifecycle
peers:
  - code-respond-to-feedbacks
  - general-writing-commit-messages
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# /pr - Smart Pull Request

## Overview

This skill creates a pull request for the current feature branch. It analyzes
the commits since the branch diverged from the target branch, pushes the
branch, and opens a PR with a properly formatted title and a comprehensive
body, then requests a Copilot code review.

Invoke as `/pr` or just say "create pull request".

Use this skill when:
- The current feature branch is ready for review and merge
- All work on the branch is committed

## Prerequisites

This skill talks to GitHub through the `gh` CLI. Before first use, set up
credentials once:

1. **Install the GitHub CLI** — `brew install gh` (macOS), `sudo apt install gh`
   (Debian/Ubuntu), or see <https://cli.github.com/> for other platforms.
2. **Authenticate** with one of:
   - Interactive (recommended for workstations): run `gh auth login`, choose
     **GitHub.com → HTTPS → Login with a web browser**. This stores a token in
     the system keychain and also sets up git credential helping for pushes.
   - Token (for CI or headless machines): export `GH_TOKEN` (or `GITHUB_TOKEN`)
     with a personal access token. A classic PAT needs the `repo` scope; a
     fine-grained PAT needs **Contents: read/write** and
     **Pull requests: read/write** on the target repository.
3. **Verify** with `gh auth status` — it must show an active account with
   access to the repository's host.
4. **Push access** — the authenticated account must be able to push the
   branch to the remote (`origin`).

If `gh auth status` fails, stop and tell the user to complete the steps above;
do not attempt to create the PR.

## What It Does

1. Runs `git status` and `git diff` to check current changes.
2. If there are uncommitted changes, asks the user to commit them first and exits.
3. Determines the base branch: `dev` if the remote has one, otherwise the
   repository default branch (`gh repo view --json defaultBranchRef`).
4. Analyzes commit history since divergence using `git diff <base>...HEAD`
   and `git log <base>..HEAD`.
5. Pushes the current branch to the remote with upstream tracking
   (`git push -u origin <branch>`).
6. Creates the PR with a properly formatted title using required prefixes:
   - `Fix:` for bug fixes
   - `Feat:` for new features
   - `Docs:`, `Test:`, `Chore:`, `CI:`, `Perf:`, `Refactor:`, `Revert:`, `Style:`
   - Or scoped versions like `Fix(scope):`, `Feat(scope):`
7. Generates a comprehensive PR body with summary, changes, and test plan.
8. Sets the base branch from step 3.
9. Requests a Copilot code review on the new PR via:

   ```bash
   gh api -X POST "repos/{owner}/{repo}/pulls/{pr}/requested_reviewers" \
       -f 'reviewers[]=copilot-pull-request-reviewer[bot]'
   ```

   (fall back to `gh pr edit <pr> --add-reviewer copilot-pull-request-reviewer[bot]`
   on newer `gh`). If the request fails (e.g. Copilot is not enabled on the
   repo), report the error but do not fail the command.

**PR Title Format:**
If the repository has a `.github/pr-title-checker-config.json`, the title must
match its patterns; otherwise use the prefix list above.

**Safe for:** Any feature branch that needs to merge into the base branch.

## Related Skills

- [general-writing-commit-messages](../general-writing-commit-messages/SKILL.md) — commit and PR title conventions
- [code-respond-to-feedbacks](../code-respond-to-feedbacks/SKILL.md) — triage and address the review comments the PR receives
