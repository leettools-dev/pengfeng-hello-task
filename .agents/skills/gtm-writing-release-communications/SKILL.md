---
name: gtm-writing-release-communications
description: "Draft release notes, changelog entries, launch emails, and social posts under gtm/marketing/ — benefit-led, claim-verified, and always published by a human."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Writing Release Communications

## Overview

`gtm/marketing/` holds the outbound story of each release: release notes, the
changelog, launch email drafts, and social copy. The same shipped change is
told at different depths to different audiences — but always as user benefit,
never as a commit log.

Use this skill when:
- A release or feature merge needs announcing (usually via `gtm-generating-launch-artifacts`)
- Maintaining the changelog
- Drafting a launch email sequence or social posts for a milestone

All output is a draft for human review. Agents do not send or post.

## Artifact Formats

### Release notes (`gtm/marketing/release-notes.md`, newest first)

```markdown
## v1.4 — 2026-07-10

### New
- **Scheduled exports** — set a weekly schedule and reports land in your inbox;
  no more Friday manual exports. [Guide](../documentation/guides/scheduled-exports.md)

### Improved
- Export generation is ~3× faster for workspaces over 10k rows.

### Fixed
- Fixed: exports could include archived items when filters were saved before v1.2.

### Changed behavior ⚠
- <anything users must adapt to, with the migration step>
```

### Changelog vs. release notes

The changelog is the complete user-visible record (every fix); release notes
curate what's worth telling. A fix can be changelog-only; a headline feature is
both.

### Launch email (one per headline feature, `gtm/marketing/emails/`)

- Subject: the benefit in ≤ 8 words, no "New Feature Announcement"
- Body: problem (1–2 sentences) → what's new → one concrete usage example →
  link to the guide → single call to action
- Mark segments if relevant: all users vs. those who requested it (the latter
  belongs to `gtm-writing-sales-collateral` follow-ups)

### Social post (`gtm/marketing/social/`)

One outcome, one visual suggestion, one link. If it needs a thread to explain,
link the release notes instead.

## Rules

- **Lead with the benefit.** "No more Friday manual exports", not "Added cron-based export scheduling".
- **Every claim verified.** Numbers ("3× faster") must come from a measurement in the PR or performance evidence; otherwise don't use a number.
- **Name changed behavior loudly.** Breaking or surprising changes get the ⚠ section, never buried in "Improved".
- **Link the docs.** Every announced feature links its guide in `gtm/documentation/`.
- **User vocabulary only.** Follow `general-frontend-ux-copy` tone rules; no internal component names.

## Anti-Patterns

- **The commit-log release note.** "Refactored export service" is not user news.
- **Superlative inflation.** "Blazing fast", "completely redesigned" — measure or omit.
- **Announcement without docs.** Shipping the email before the guide exists.
- **Silent breaking changes.** A changed default noted nowhere users look.

## Checklist

- [ ] Release notes grouped New / Improved / Fixed / Changed behavior
- [ ] Every entry states user benefit in user vocabulary
- [ ] Numeric claims traceable to measurements
- [ ] Changed behavior called out with migration steps
- [ ] Each announced feature links its user guide
- [ ] Drafts marked for human review; nothing auto-published
