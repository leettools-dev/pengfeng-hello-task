---
name: gtm-writing-user-documentation
description: "Write and maintain user-facing documentation under gtm/documentation/ — onboarding, task-oriented guides, and API reference kept in sync with the OpenAPI contract and shipped behavior."
layer: lifecycle
peers:
  - general-designing-apis
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Writing User Documentation

## Overview

`gtm/documentation/` holds what users read: onboarding, how-to guides, and API
reference. Documentation is part of the feature — a capability users can't
discover or operate does not exist commercially.

Use this skill when:
- A user-facing feature ships (usually invoked via `gtm-generating-launch-artifacts`)
- Behavior changes make existing guides wrong
- The API contract changes (new endpoints, parameters, responses)
- Setting up the initial docs structure for a new product

## Structure

```text
gtm/documentation/
├── getting-started.md      # First-run: install/sign-up → first success
├── guides/                 # One task-oriented guide per user job
├── reference/
│   ├── api.md              # Generated or derived from the OpenAPI spec
│   └── configuration.md    # User-visible settings
└── faq.md                  # Real questions only — seeded from support threads
```

## Rules

- **Task-oriented, not feature-oriented.** A guide is named for the user's job
  ("Export weekly reports"), not the feature ("The Export Module"). One guide
  per job; if a guide covers three jobs, split it.
- **Getting-started must reach a success.** The new user follows it end to end
  and sees the product do something valuable — not just complete installation.
- **API reference derives from the contract.** The backend's route schemas
  generate OpenAPI (see [api-contracts](../general-designing-apis/references/api-contracts.md));
  reference docs derive from that spec. Never hand-document an endpoint the
  spec doesn't show, and regenerate when the spec changes.
- **Verify every step.** Run each documented command and click path against
  the shipped build before committing. A doc bug is a product bug.
- **Write for the reader's vocabulary.** No internal names, ticket numbers, or
  codebase terms. Follow the tone rules in `general-frontend-ux-copy`.
- **Date or version-mark guides** whose behavior varies by release.

## Update Discipline

| Trigger | Action |
|---------|--------|
| Feature ships | New or updated guide in the same GTM pass |
| Behavior change | Fix affected guides in the shipping PR or its GTM follow-up |
| API change | Regenerate reference from the updated OpenAPI spec |
| Support question recurs | Add to `faq.md` with the real answer, then consider whether the UI or a guide should have prevented it |

## Anti-Patterns

- **Feature-tour docs.** Pages that enumerate UI controls instead of walking a task.
- **Aspirational docs.** Documenting what the PRD intended rather than what shipped.
- **Hand-maintained API reference.** It drifts from the contract within weeks; derive it.
- **FAQ as a dumping ground.** Entries no one ever asked, hiding the ones they did.

## Checklist

- [ ] Guides named and organized by user task
- [ ] Getting-started verified to reach a first success
- [ ] API reference regenerated from the current OpenAPI spec
- [ ] Every documented step executed against the shipped build
- [ ] No internal jargon; tone follows ux-copy rules
