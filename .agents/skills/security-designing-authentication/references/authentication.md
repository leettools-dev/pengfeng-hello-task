# Authentication

Authentication establishes who or what is acting. It is separate from
authorization, which decides what that identity may do.

## Select the Model by Client Type

| Client | Default |
|--------|---------|
| First-party browser application | Server-side session identified by an HTTP-only secure cookie |
| Browser application using external identity | OpenID Connect authorization-code flow |
| VS Code extension, native, or mobile application | System-browser authorization-code flow with PKCE |
| Service-to-service integration | Short-lived workload identity or OAuth client credentials |
| Personal/local single-user tool | No login unless it exposes data or control beyond the local OS user boundary |

Do not implement a custom OAuth or password protocol. Prefer a maintained
identity provider when account recovery, MFA, enterprise federation, or
administration is required.

## Required Design Decisions

The dev spec must record:

- identity provider and supported login methods
- account lifecycle: invitation, signup, verification, suspension, deletion
- session/token storage and transport
- idle, absolute, and renewal expiration
- logout and server-side revocation behavior
- account recovery and reauthentication for sensitive actions
- MFA/passkey requirements
- CSRF protection for cookie-authenticated state changes
- rate limits and abuse controls for login and recovery
- audit events and fields

## Browser Session Baseline

- Generate opaque high-entropy session identifiers.
- Store session state server-side.
- Set cookies `HttpOnly`, `Secure`, and an intentional `SameSite` value.
- Regenerate the session identifier after login and privilege changes.
- Enforce idle and absolute expiration on the server.
- Invalidate sessions on logout, account disablement, credential reset, and
  other relevant risk events.
- Protect state-changing requests against CSRF; `SameSite` is defense in depth,
  not the complete policy.
- Never expose session or refresh credentials to application JavaScript unless
  the selected client model requires it and the risk is documented.

## Fastify OIDC Authorization-Code Recipe

Use this recipe for a first-party Fastify browser app that delegates identity
to Google or another OpenID Provider. Use a maintained OIDC client for
discovery, authorization URL construction, code exchange, JWKS handling, and
ID-token verification; application code owns the state/session boundary below.

1. Register `@fastify/cookie` before auth hooks and routes. Supply rotating
   signing keys from validated secret config; never an in-code default.
2. On `GET /auth/login`, generate high-entropy `state`, `nonce`, and PKCE
   verifier values. Persist a short-lived, one-time pending-login record keyed
   by `state` containing the nonce, PKCE verifier, safe post-login return path,
   and expiry. Send the raw `state` to the provider and put the same value in a
   signed `__Host-oidc-state` cookie.
3. On the callback, require the query `state` to match the valid signed cookie
   in constant time, atomically consume the pending-login record, and clear the
   state cookie. Reject missing, invalid, expired, or replayed state before
   exchanging the authorization code.
4. Exchange the code on the server with the saved PKCE verifier. Verify the ID
   token's signature, issuer, audience, expiry, and nonce. Require
   `email_verified === true` when email is used as identity. Apply any domain
   allowlist to the normalized verified claim with an exact domain comparison,
   never to an unverified request field.
5. Create a new opaque, high-entropy session id; persist its session record
   server-side and set it in a signed `__Host-session` cookie. Regenerate the
   id after login or privilege change. For cookie-authenticated writes, require
   a separate CSRF token/header policy in addition to `SameSite`.
6. On logout or revocation, delete the server-side session and clear the cookie
   with the same path attributes used when setting it.

Cookie and comparison skeleton:

```typescript
import cookie from "@fastify/cookie";
import { randomBytes, timingSafeEqual } from "node:crypto";

await app.register(cookie, { secret: config.cookieSigningKeys });

const oidcCookie = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  signed: true,
  maxAge: 10 * 60,
};

function equalSecret(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Login route: also persist { state, nonce, pkceVerifier, expiresAt }.
const state = randomBytes(32).toString("base64url");
reply.setCookie("__Host-oidc-state", state, oidcCookie);

// Callback route, before code exchange:
const signedState = request.cookies["__Host-oidc-state"];
const cookieState = signedState && request.unsignCookie(signedState);
const queryState = (request.query as { state?: unknown }).state;
if (
  !cookieState ||
  !cookieState.valid ||
  typeof cookieState.value !== "string" ||
  typeof queryState !== "string" ||
  !equalSecret(cookieState.value, queryState)
) {
  // AuthenticationError is the service's opaque 401 AppError.
  throw new AuthenticationError("Invalid OAuth state");
}
reply.clearCookie("__Host-oidc-state", { path: "/" });
```

Keep provider-returned tokens server-side and discard them when the application
only needs the verified identity. Do not replace the opaque session with a
long-lived cookie containing all session claims merely because the cookie is
signed: signing detects tampering but does not provide confidentiality,
immediate logout, account-disable revocation, or per-session invalidation.
A stateless session is an Architecture Decision that must add short expiry and
a server-side revocation/version mechanism sufficient for the required
lifecycle; otherwise it does not meet the browser baseline.

## Failure Behavior

Use generic login and recovery responses that do not reveal whether an account
exists. Log enough server-side context to investigate abuse without logging
passwords, session IDs, authorization codes, access tokens, or recovery
secrets.

## Verification

Test successful and failed login, logout, expiry, revocation, CSRF rejection,
session rotation, disabled accounts, recovery, reauthentication, and
concurrent sessions. Browser tests must cover the real session lifecycle even
when most tests reuse authenticated state.

Use the current OAuth Security Best Current Practice (RFC 9700), OpenID
Connect specifications, and OWASP authentication/session guidance as primary
external references.

## Primary References

- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/rfc9700)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [@fastify/cookie](https://github.com/fastify/fastify-cookie)
