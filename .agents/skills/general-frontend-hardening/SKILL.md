---
name: general-frontend-hardening
description: "Harden frontend features and API-adjacent browser workflows against real-world edge cases, failures, accessibility gaps, privacy leaks, auth or permission states, concurrency, long text, and malformed or large data. Use when asked to make a frontend robust, resilient, production-ready, edge-case-safe, or better at error handling."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Frontend Hardening

Make the target survive messy real usage, not only ideal demo data. Prefer
focused resilience changes over broad rewrites.

Read `general-handling-errors` for error strategy and `general-frontend-verify`
for browser verification. Use `general-frontend-responsive-design` when the
hardening risk is mostly viewport, zoom, keyboard, or touch behavior.

## Hardening Checklist

Check the affected workflow against:

- Empty, missing, malformed, partial, stale, very large, or high-count data.
- Long user-generated names, labels, paths, messages, comments, table cells,
  identifiers, and translated strings.
- API failures: validation, 401, 403, 404, 409, 429, timeout, offline, aborted
  request, and unexpected 500.
- Auth and permission states: anonymous, expired session, revoked token, missing
  CSRF, insufficient role, owner-only action, and tenant mismatch.
- Concurrent operations: double submit, repeated clicks, stale form data,
  optimistic update conflicts, background refetch, and tab duplication.
- Accessibility: keyboard operation, focus retention after errors, reduced
  motion, non-color state indicators, and screen-reader-safe async updates.
- Privacy: no secrets, credentials, tokens, local paths, raw sensitive records,
  or internal traces in broad UI, browser storage, logs, screenshots, or error
  copy.
- Internationalization: RTL text, CJK, emoji, long English, locale-specific
  numbers, dates, times, and 200 percent zoom.

## Implementation Rules

- Treat failure modes as explicit UI states: loading, success, empty,
  validation error, auth error, permission error, conflict, offline, and
  unexpected error.
- Keep user work across recoverable failures. Avoid clearing forms, drafts, or
  selections unless the user asked for it.
- Disable, debounce, or make idempotent actions that should not run twice.
- Show useful recovery copy without leaking backend internals or sensitive data.
- Use stable layout constraints so long text cannot overflow controls or push
  critical actions off screen.
- Prefer `Intl` APIs for dates, times, numbers, currencies, and relative labels.
- Add focused tests for fixed edge cases; use browser checks for layout,
  keyboard, auth-state, and error-state changes.

## Verification

Run the narrowest checks that cover the risk: unit tests for state logic,
route/API tests for status handling, and Playwright/browser checks for
overflow, keyboard paths, error states, auth states, and responsive layouts.
Report any edge case intentionally left unsupported and why.
