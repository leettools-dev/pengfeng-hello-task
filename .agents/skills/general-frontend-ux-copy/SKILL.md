---
name: general-frontend-ux-copy
description: "Improve frontend UX copy, labels, empty states, validation messages, error messages, confirmations, privacy warnings, destructive-action text, onboarding text, and API-facing user messages. Use when copy is vague, unsafe, too technical, too verbose, misleading, or hard to act on."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Frontend UX Copy

Make interface text specific, outcome-oriented, and safe in context. Favor
language that helps the user decide and recover.

Read `general-handling-errors` when changing error copy. Use
`general-frontend-design` when copy changes affect hierarchy, layout, or visual
state.

## Copy Principles

- State the action outcome: `Create project`, `Invite member`, `Revoke token`,
  `Delete file`, `Publish changes`, `Retry payment`.
- Use short labels for repeated controls and fuller text where users need
  consequences, constraints, or recovery steps.
- Distinguish validation failures, permission failures, expired auth, conflicts,
  offline state, and unexpected failures.
- Use product terms consistently. Avoid leaking backend, database, or framework
  terms unless the UI is explicitly developer-facing.
- Keep empty states to one helpful sentence plus one clear next action when an
  action exists.
- Preserve trust: do not make destructive, public, financial, privacy-sensitive,
  or credential-related actions sound casual.

## Error And Confirmation Copy

- Replace vague errors like `Something went wrong` with the failure class and a
  recovery action.
- Write confirmations around consequences: what will change, who is affected,
  whether it can be undone, and what happens next.
- Do not expose stack traces, query details, internal service names, local
  paths, tokens, credentials, or secret-looking values in user-facing text.
- If an endpoint returns safe structured details, show only the portions meant
  for users.

## Editing Pass

1. Inventory labels, helper text, empty states, errors, confirmations, toasts,
   dialog titles, and destructive actions in the affected flow.
2. Normalize terms and action verbs.
3. Shorten text that appears repeatedly; expand only at high-risk decision
   points.
4. Check the changed text in the UI at desktop and mobile widths.

## Verification

Confirm changed text wraps without breaking layout, remains screen-reader
understandable, and still identifies the state or action without relying only
on color or position.
