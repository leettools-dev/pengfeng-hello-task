# Playwright Testing

Playwright serves two related but distinct purposes:

1. Persistent end-to-end tests committed under `e2e/`.
2. Focused browser verification performed by an agent for a specific UI
   change.

Do not replace maintainable product tests with temporary verification scripts.

## Persistent Suite Structure

```text
e2e/
  fixtures/
    test.ts
    accounts.ts
    data.ts
  auth/
    login.setup.ts
    session.spec.ts
  documents/
    create-document.spec.ts
    permissions.spec.ts
playwright.config.ts
playwright/.auth/          # gitignored
```

Use fixtures for test data, accounts, API clients, and reusable page objects.
Fixtures must own both setup and teardown. Tests must be independently
runnable and parallel-safe.

## Locators and Readiness

- Prefer `getByRole`, `getByLabel`, `getByText`, and explicit test IDs.
- Use Playwright's awaited web assertions.
- Do not wait with arbitrary sleeps.
- Do not use `networkidle` as the definition of application readiness.
- Assert the user-visible state that proves the page is ready.
- Keep page objects focused on meaningful user operations, not wrappers around
  every locator.

## Authentication

Store generated browser state under `playwright/.auth/` and never commit it.

- Read-only tests may share an account if they cannot affect one another.
- Tests that mutate server state should use one account and isolated data
  namespace per parallel worker.
- Define role-specific fixtures or projects for authorization tests.
- Keep at least one test of the real login/logout/session lifecycle; other
  tests may authenticate through setup or an API to reduce cost.

## Projects

Use projects for meaningful variations:

- unauthenticated, member, manager, and administrator states
- Chromium smoke tests on pull requests
- Firefox/WebKit or mobile viewport tests on main/scheduled runs
- setup dependencies that create authenticated state or seed data

Do not multiply every test across every role and browser. Run each scenario
against the configurations whose differences could change its behavior.

## Diagnostics and CI

- `trace: "on-first-retry"` in CI.
- Screenshots and video on failure when they add evidence.
- HTML/JUnit reports retained as CI artifacts.
- Retries only in CI and kept low; a passing retry still creates flaky-test
  work.
- Shard only after tests are isolated and deterministic.

## Agent Verification

For a focused UI change, an agent may create a temporary Playwright test that:

- visits affected routes
- performs the changed interaction
- asserts visible outcomes
- fails on unexpected console errors or application API failures
- captures screenshots when useful

If the verification protects a durable behavior or reproduces a bug, move it
into the committed suite instead of deleting it.

## Primary References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Playwright Projects](https://playwright.dev/docs/test-projects)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
