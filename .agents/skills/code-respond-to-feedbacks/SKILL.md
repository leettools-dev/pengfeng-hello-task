---
name: code-respond-to-feedbacks
description: "Read code review feedback from a GitHub PR (via `gh` CLI), a local file, or pasted text, triage each item, apply fixes when appropriate, and summarize reviewer-ready responses in the terminal. Optionally post replies back to the GitHub PR."
argument-hint: "[pr-url | pr-number | file-path]"
disable-model-invocation: true
layer: lifecycle
peers:
  - general-writing-commit-messages
  - pr
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Code Respond To Feedbacks

## Overview

This skill takes code review feedback, examines the referenced code, fixes what
should be fixed, and prints a concise response summary in the terminal. It
supports three input sources:

1. A **GitHub PR** (URL or number) — fetched via the `gh` CLI
2. A **local file** (markdown, JSON, YAML, text)
3. **Pasted text** directly in the prompt

When the input is a GitHub PR, the skill can also post replies back to the PR
using `gh api` / `gh pr comment`.

Invoke as:
- `/code-respond-to-feedbacks https://github.com/owner/repo/pull/123`
- `/code-respond-to-feedbacks 123` (uses the current repo)
- `/code-respond-to-feedbacks review-notes.md`
- `/code-respond-to-feedbacks` and paste text directly

Use this skill when:
- A GitHub PR has review comments and the user wants them triaged and addressed
- The user provides review feedback in a local file, note, JSON/YAML blob, or pasted text
- The user wants both code changes and reviewer-ready response text

## Prerequisites

- The repository is available locally
- The feedback includes either file/line context or enough detail to find the relevant code

**For GitHub-PR input**, the `gh` CLI must be installed and authenticated.
Set up credentials once:

1. **Install the GitHub CLI** — `brew install gh` (macOS), `sudo apt install gh`
   (Debian/Ubuntu), or see <https://cli.github.com/> for other platforms.
2. **Authenticate** with one of:
   - Interactive (recommended for workstations): run `gh auth login`, choose
     **GitHub.com → HTTPS → Login with a web browser**.
   - Token (for CI or headless machines): export `GH_TOKEN` (or `GITHUB_TOKEN`)
     with a personal access token. A classic PAT needs the `repo` scope; a
     fine-grained PAT needs **Contents: read/write**,
     **Pull requests: read/write**, and — if the skill should open tracking
     issues — **Issues: read/write** on the target repository.
3. **Verify** with `gh auth status` — it must show an active account with
   access to the repository's host.

If `gh auth status` fails when the input is a PR, stop and tell the user to
complete the steps above; local-file and pasted-text input still work without
credentials.

## Key Concepts

### Verdicts

| Verdict | Meaning | Action |
|---|---|---|
| **Fixable** | The feedback points to a real issue that can be corrected in the current scope | Apply the fix, run targeted verification, reply to the comment (if PR), include a response summary |
| **Not fixable now** | The feedback is valid but out of scope or blocked by other work | Do not change code unless needed for safety; explain why it is deferred and suggest next steps. For GitHub PRs, optionally open a tracking issue via `gh issue create` and link it in the reply |
| **Not reasonable** | The feedback does not apply or would cause a regression | Do not change code; explain the technical reasoning clearly |

### Working Rules

- Process one feedback item at a time from intake to conclusion
- Keep each code change traceable to a specific feedback item or small cluster of related items
- Prefer the smallest coherent fix that directly addresses the feedback
- If several feedback items share the same root cause, fix it once and mention the linkage in each response
- If feedback conflicts with project conventions, existing behavior, or other feedback, call out the tradeoff before changing code
- Do not invent certainty: if location, intent, or validation is unclear, say so in the summary

### Input Sources

Accept any of:
- A GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`) via `$ARGUMENTS`
- A GitHub PR number (e.g. `123`) via `$ARGUMENTS` — resolved against the current repo
- A file path passed via `$ARGUMENTS` (any format: `.md`, `.json`, `.yaml`, `.txt`, etc.)
- Pasted text when `$ARGUMENTS` is empty

The input can be structured or unstructured. Preserve identifiers, file paths,
line numbers, and quoted text when available.

## Implementation Guide

### Step 1: Load and normalize the feedback

**If `$ARGUMENTS` looks like a GitHub PR (URL or bare number):**

Fetch the review comments with `gh`. Use the review-comments endpoint for
inline comments and the issue-comments endpoint for general PR comments:

```bash
# Inline review comments (tied to a file + line)
gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/{owner}/{repo}/pulls/{number}/comments" \
    --paginate

# General PR conversation comments
gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/{owner}/{repo}/issues/{number}/comments" \
    --paginate

# Review bodies (summaries attached to a review)
gh api \
    -H "Accept: application/vnd.github+json" \
    "/repos/{owner}/{repo}/pulls/{number}/reviews" \
    --paginate
```

If the user supplies a bare PR number, derive `{owner}/{repo}` from
`gh repo view --json nameWithOwner -q .nameWithOwner`.

Capture for each comment:
- `id` (numeric GitHub comment id — needed to reply)
- `path` and `line` / `original_line` (for inline comments)
- `body` (the review text)
- `user.login` (reviewer)
- `html_url` (for citation in the summary)
- `in_reply_to_id` (for thread context)

**If `$ARGUMENTS` is a file path:**
- Read the file at the given path
- Keep the raw structure if it is already JSON, YAML, or markdown with clear item boundaries

**If `$ARGUMENTS` is empty or the user pastes text:**
- Treat the pasted block as the source of truth
- Split it into distinct feedback items before touching code

Capture these fields when available:
- Item id, heading, or ordinal number
- Original feedback text
- File path and line number
- Symbol, function, class, or test name
- Any explicit expected behavior

Common input shapes:

```text
1. src/foo.py:42 - Avoid division by zero here.
2. tests/test_foo.py - Missing coverage for empty input.
```

```json
[
  {
    "id": "1",
    "file": "src/foo.py",
    "line": 42,
    "body": "Avoid division by zero here."
  }
]
```

```markdown
### Comment 3
File: src/foo.py
Line: 42
Feedback: Avoid division by zero here.
```

If the input is noisy or ambiguous, rewrite it into a short internal list of
feedback items before continuing.

### Step 2: Map each item to code

For each item:
1. Open the referenced file and read enough surrounding code to understand the behavior.
2. If only a symbol, error message, or behavior is mentioned, search the repository for the best match.
3. If the file/line no longer matches exactly, use nearby context or blame-free inference from the current code.
4. If multiple matches remain plausible, state the assumption before editing.

Do not batch-read the whole repository without a lead. Start from the
feedback's strongest anchor.

### Step 3: Triage the item

**Fixable**
- Real bug, logic issue, edge case, missing validation, missing test, or in-scope quality improvement

**Not fixable now**
- Valid suggestion, but it needs a broader refactor, cross-team coordination, product clarification, or work outside the current change boundary

**Not reasonable**
- Based on a misread, already handled elsewhere, conflicts with current design constraints, or would make the code worse

Process the current item to completion before moving to the next one.

### Step 4A: If fixable, implement and verify

1. Make the smallest change that resolves the issue cleanly.
2. Update or add tests when the feedback affects behavior.
3. Run the narrowest useful verification first.
4. Expand verification only as needed when the change touches shared code paths.
5. Record what changed, why it changed, and what was verified.

**For GitHub PR input**, reply to the comment. Use the review-comment reply
endpoint for inline comments; use the issues-comments endpoint for general
comments:

```bash
# Reply to an inline review comment (threaded)
gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    "/repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies" \
    -f body="Handled in this change. <short explanation>"

# Reply to a general PR comment (posts a new PR conversation comment)
gh pr comment {number} --body "Handled in this change. <short explanation>"
```

Terminal response template:

```text
Handled in this change.

- What changed: [1-2 sentences]
- Why: [tie directly to the feedback]
- Verification: [test command run, or "not run" with reason]
```

### Step 4B: If not fixable now, defer explicitly

Do not force an oversized change just to satisfy the feedback.

1. Explain why the suggestion is valid.
2. Explain why it is out of scope or blocked.
3. Suggest the next action.
4. For GitHub PR input, optionally open a tracking issue — but only if the
   user asks or if the project convention expects one:

   ```bash
   gh issue create \
       --title "<short title summarising the deferred work>" \
       --body "Deferred from PR #<n> comment: <html_url>\n\nReason: <...>"
   ```

   Then include the issue URL in the reply body.

Terminal response template:

```text
Valid point, but I did not change it in this pass.

- Reason deferred: [scope, dependency, or risk]
- Suggested follow-up: [ticket, issue URL, or next step]
```

### Step 4C: If not reasonable, explain without changing code

Keep the response technical and specific. Reference current behavior, existing
constraints, or project conventions.

Terminal response template:

```text
I reviewed this item and did not change the code.

- Reason: [technical explanation]
- Supporting context: [file, behavior, convention, or dependency]
```

For GitHub PR input, post the reply using the same `gh api .../replies` or
`gh pr comment` call shown in Step 4A.

### Step 5: Resolving review threads (GitHub-specific)

GitHub's REST API does not expose a "resolve review thread" endpoint. To
resolve a thread programmatically, use the GraphQL API:

```bash
# 1. Find the thread id for a given inline comment:
gh api graphql -f query='
  query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$number) {
        reviewThreads(first:100) {
          nodes { id isResolved comments(first:1){ nodes { id databaseId path line } } }
        }
      }
    }
  }' -F owner={owner} -F repo={repo} -F number={number}

# 2. Resolve the thread:
gh api graphql -f query='
  mutation($threadId:ID!) {
    resolveReviewThread(input:{threadId:$threadId}) { thread { isResolved } }
  }' -F threadId=<thread_node_id>
```

Only resolve threads for **Fixable** or **Not reasonable** verdicts. Leave
**Not fixable now** threads open so the reviewer can see the deferral.

### Step 6: Commit and push any code changes

After all fixable comments have been addressed:

```bash
git add <changed files>
git commit -m "fix: address PR review comments"
git push
```

Follow the project's commit message conventions.

## Final Terminal Summary

After all items are processed, print a compact summary for the user. Include
one block per feedback item:

```text
Feedback 1 - FIXABLE
Source: src/foo.py:42 (PR comment https://github.com/owner/repo/pull/123#discussion_rNNN)
Change: Added a zero guard before division in `calculate_ratio`
Verification: pytest tests/test_foo.py -k ratio
Suggested response:
Handled in this change.

Feedback 2 - NOT FIXABLE NOW
Source: src/bar.py:88
Suggested response:
Valid point, but I did not change it in this pass.
```

Also include:
- Files changed
- Tests or checks run
- Any assumptions made while mapping feedback to code
- Any feedback items that remain unresolved
- For GitHub input: which replies were posted (and to which comment ids)

## Checklist

- [ ] Every feedback item was normalized into a discrete unit of work
- [ ] Each item was classified as fixable, not fixable now, or not reasonable
- [ ] Code changes are traceable back to the item that caused them
- [ ] Tests or checks were run when appropriate, or the lack of verification was stated explicitly
- [ ] The terminal summary includes reviewer-ready response text for each item
- [ ] Ambiguities and assumptions were called out instead of hidden
- [ ] For GitHub input: replies were posted (or the user was told which replies are pending)

## Common Pitfalls

**Mistake 1: Treating the whole feedback document as one task**
- Wrong: Make a broad sweep of unrelated edits and summarize them once
- Right: Break the input into discrete feedback items and finish them one by one

**Mistake 2: Changing code before confirming the feedback applies**
- Wrong: Edit based on a guessed location or stale line number
- Right: Re-anchor the feedback in the current code before changing anything

**Mistake 3: Over-scoping a valid suggestion**
- Wrong: Start a large refactor for a small review note
- Right: Defer when the change is valid but too large for the current pass

**Mistake 4: Writing vague response summaries**
- Wrong: "Fixed" or "Will consider later"
- Right: State what changed, why, and what was verified

**Mistake 5: Hiding uncertainty**
- Wrong: Pretend the feedback mapped cleanly when it did not
- Right: State the assumption or missing context directly in the summary

**Mistake 6: Auto-posting to GitHub without confirmation**
- Wrong: Fire off `gh api` replies before the user has seen the planned response
- Right: Print the planned replies first; post only after the user confirms (unless the user explicitly asked for automatic posting)

## References

See [references.md](references.md) for additional resources on code review
best practices and GitHub API endpoints used by this skill.

## Example Run

```text
> /code-respond-to-feedbacks https://github.com/owner/repo/pull/42

Input: GitHub PR #42 (owner/repo) — fetched 3 review comments via `gh api`

Feedback 1 - FIXABLE
Source: backend/service.py:57 (comment 1234567890)
Change: Added a null guard before accessing `job.status`
Verification: pytest tests/test_service.py -k job_status
Posted reply: https://github.com/owner/repo/pull/42#discussion_r1234567890
Suggested response:
Handled in this change.

Feedback 2 - NOT FIXABLE NOW
Source: backend/cache.py:21 (comment 1234567891)
Suggested response:
Valid point, but I did not change it in this pass.
(reply not posted — awaiting confirmation)

Feedback 3 - NOT REASONABLE
Source: frontend/dashboard.tsx:103 (comment 1234567892)
Posted reply + resolved thread via GraphQL
Suggested response:
I reviewed this item and did not change the code.
```
