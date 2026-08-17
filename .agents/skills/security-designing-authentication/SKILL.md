---
name: security-designing-authentication
description: "Select, specify, implement, or review authentication for browser, mobile, VS Code, local, and service clients, including sessions, OpenID Connect, OAuth/PKCE, account lifecycle, MFA, recovery, CSRF, expiration, revocation, audit events, and tests. Use whenever a PRD, dev spec, API, or application introduces login, identity, sessions, tokens, or account recovery."
layer: lifecycle
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Designing Authentication

Read [the authentication guide](references/authentication.md). Use
[the threat-model template](assets/threat-model.md) for systems with
external users, sensitive data, or federated identity.

## Process

1. Classify every client and trust boundary.
2. Decide whether authentication is needed at all.
3. Select the standard flow for each client; do not invent a protocol.
4. Specify identity provider, account lifecycle, credential/session transport,
   expiration, rotation, revocation, recovery, reauthentication, MFA, CSRF,
   rate limits, and audit events.
5. Separate authentication from authorization in the design and code.
6. Add negative and lifecycle tests before considering the design complete.
7. Record provider-specific choices and deviations as Architecture Decisions.

For a first-party Fastify browser app using external identity, instantiate the
OIDC authorization-code recipe in the canonical guide: signed short-lived
state cookie + one-time server-side login record, verified ID token, opaque
server-side session, explicit CSRF control, and optional verified-email domain
allowlist. Do not substitute a stateless signed session unless its revocation
design is recorded and meets the required lifecycle.

## Output

Produce a concrete dev-spec section, not "use secure authentication." Name
the flow, cookies or token locations, expiration rules, revocation triggers,
recovery behavior, sensitive operations requiring reauthentication, audit
events, and required tests.

For permissions, roles, tenant scope, and resource access, use
`security-designing-authorization`.
