---
name: gtm-generating-launch-artifacts
description: "After a feature merges, scan the PRD and merged diff, decide which go-to-market artifacts are affected, and draft matching updates under gtm/ — user docs, release communications, and sales follow-ups — for human review before publishing."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Generating Launch Artifacts from Merged Changes

## Overview

This is the `generate-gtm-artifacts` function of the product venture scaffold:
code that merges without matching go-to-market artifacts is a feature users
never hear about. After a merge to `main`, this skill turns the PRD plus the
merged diff into draft artifacts under `gtm/`, then hands them to a human for
review and publishing.

Use this skill when:
- A feature PR has merged to `main`
- Preparing a versioned release or launch
- Auditing `gtm/` for drift against recently shipped features

Everything produced here is a **draft**. Humans publish; agents never send
emails, post publicly, or push docs to a public site on their own.

## Process

### Step 1: Gather the Inputs

- The merged diff (`git log`/`git diff` since the last release tag or GTM pass)
- The PRD(s) in `docs/prd/` the change implements
- Existing artifacts in `gtm/` that the change may invalidate
- The requester trail: customers or research themes in `docs/research/` that
  asked for this (for sales follow-ups)

### Step 2: Classify the Change

| Change type | User docs | Release comms | Sales collateral |
|-------------|-----------|---------------|------------------|
| New user-facing feature | new/updated guide | release notes + launch copy | feature sheet + follow-ups to requesters |
| Behavior change to existing feature | update affected guides | release notes (call out the change) | update affected sheets |
| API contract change | regenerate/patch API docs | release notes with migration note | — |
| Bug fix, visible | — | changelog entry | follow-up only if a customer reported it |
| Internal refactor, invisible | — | — | — |

If every row lands on "—", stop and say so. Do not manufacture announcements
for invisible changes.

### Step 3: Draft the Artifacts

Delegate to the focused skills, in this order (docs first — comms link to them):

1. `gtm-writing-user-documentation` → `gtm/documentation/`
2. `gtm-writing-release-communications` → `gtm/marketing/`
3. `gtm-writing-sales-collateral` → `gtm/sales/`

Every claim in a draft must be traceable to the diff or the PRD. If the PRD
promised something the diff does not deliver, flag the mismatch instead of
papering over it — that is a product bug, not a copywriting problem.

### Step 4: Package for Human Review

Commit the drafts on a branch (or include them in the release PR) with a
summary table:

```markdown
## GTM drafts for <feature / release>
| Artifact | Path | Status |
|----------|------|--------|
| User guide | gtm/documentation/... | new draft |
| Release notes | gtm/marketing/release-notes.md | updated |
| Follow-up email | gtm/sales/followups/... | draft — needs recipient confirmation |
```

State explicitly what the human must do: review copy, confirm recipients,
publish docs, send emails.

## Anti-Patterns

- **Announcing the diff.** Release notes that read like commit messages. The unit of communication is user benefit, not code change.
- **GTM debt.** "We'll write the docs after the next feature" — drift compounds; run this skill per merge or per release, not per quarter.
- **Autonomous publishing.** Drafting is agent work; sending is human work. No exceptions for "small" posts.
- **Inventing capability.** Copy that promises what the PRD wanted but the code doesn't do. Verify claims against the diff.

## Checklist

- [ ] Diff and PRD gathered since last GTM pass
- [ ] Change classified; invisible changes explicitly skipped
- [ ] Affected artifacts drafted via the three gtm-writing skills
- [ ] Every claim traceable to diff or PRD; mismatches flagged
- [ ] Drafts committed with a review table and explicit human actions
