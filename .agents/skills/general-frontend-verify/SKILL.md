---
name: general-frontend-verify
description: "Compatibility entry point for focused browser verification after UI, styling, routing, or frontend logic changes. Use Playwright to exercise affected routes, assert visible outcomes, detect application console/network failures, and capture diagnostic evidence; use testing-with-playwright for persistent E2E suite design."
layer: lifecycle
applies_when:
  frontend: [react, vue]
peers:
  - testing-with-playwright
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Frontend Verification

Use `testing-with-playwright` and read
[the Playwright guide](../testing-with-playwright/references/playwright.md). This skill remains as
a compatibility entry point for existing workflows.

## Procedure

1. Identify affected routes and user interactions from the change.
2. Ensure required application services are running.
3. Reuse the committed Playwright configuration when available.
4. Prefer an existing persistent test. Add one when the behavior is durable or
   the change fixes a regression.
5. Otherwise, create a focused temporary test outside the repository.
6. Use accessible locators and awaited web assertions.
7. Assert the visible state that proves readiness; do not use `networkidle` or
   arbitrary sleeps.
8. Fail on unexpected application console errors and relevant API failures.
9. Capture a trace on failure and screenshots when they provide useful visual
   evidence.
10. Fix failures and rerun before reporting success.

## Report

Include the route/flow, project or browser, command, assertion result, and any
remaining console/network issue. Screenshots alone are not verification.

Remove temporary tests after success unless they should become regression
coverage.
