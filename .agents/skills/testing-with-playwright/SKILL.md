---
name: testing-with-playwright
description: "Build, debug, and review reliable Playwright browser tests, fixtures, authenticated states, projects, test data, traces, and CI execution. Use for persistent end-to-end suites, browser regression tests, role-based UI flows, cross-browser checks, or focused verification of frontend changes."
layer: lifecycle
applies_when:
  frontend: [react, vue]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Testing with Playwright

Read [the Playwright guide](references/playwright.md) before changing
the suite.

## Choose the Output

- For durable product behavior or a regression, add a committed test under
  `e2e/`.
- For a narrow one-time UI check, create a focused temporary verification.
- If temporary verification catches a durable defect, promote it into `e2e/`.

## Process

1. Identify the user-visible outcome and configurations that can change it.
2. Reuse or add fixtures for accounts, roles, API setup, data, and teardown.
3. Keep each test isolated and parallel-safe.
4. Use accessible locators and awaited web assertions.
5. Assert readiness through visible application state; never use
   `networkidle` or arbitrary sleeps as the test oracle.
6. Run the smallest relevant project, then the required CI browser projects.
7. Inspect traces and application logs on failure; fix and rerun.

## Authentication and Roles

Store browser state under gitignored `playwright/.auth/`. Read-only tests may
share an account. State-changing tests need isolated data and normally one
account per worker. Model roles through fixtures or projects and include
cross-tenant denials where authorization is relevant.

## Evidence

Report the tested routes and flows, browser/project, passing command, and any
trace or screenshot generated for a failure. A screenshot without assertions
is not a passing test. Route run-generated screenshots, videos, traces, and
HTML reports to gitignored output retained by CI or the foreman's vault; never
configure a test run to overwrite a committed evidence file. Commit a visual
golden only when it is an intentional deterministic test fixture, and fail on
unexpected changes rather than refreshing it silently.
