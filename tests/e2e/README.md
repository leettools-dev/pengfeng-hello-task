# E2E Tests

`look.e2e.test.ts` covers PRD §Primary flow "Look": it starts the real
Fastify server on an OS-assigned port and issues a real `fetch()` request
against it, asserting the response and its latency — not Playwright, since
the app has no client-side JavaScript to browser-test (`docs/dev-spec.md`
§3.3.1). Add a Playwright suite here instead if the product ever grows a
browser-interactive UI.
