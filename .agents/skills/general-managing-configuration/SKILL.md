---
name: general-managing-configuration
description: "Own the configuration and secrets boundary — env-schema validation at startup, typed config instead of process.env, a committed .env.example, runtime secret injection, redaction, and rotation. Use when adding a config value or credential, wiring a new environment, or reviewing how a service reads its settings."
layer: lifecycle
peers:
  - general-setting-up-observability
  - security-designing-authorization
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Managing Configuration and Secrets

## Overview

Configuration is everything that varies between environments; secrets are the
subset that must never be exposed. Both enter the process through one validated
boundary and are never hard-coded or committed.

This is a shared-policy skill: deployment, backend, and frontend skills declare
it as a peer rather than restating the rules. The full policy — configuration
loading, secret handling, frontend exposure, and verification — is in
[references/configuration.md](references/configuration.md).

Use this skill when:
- Adding an environment variable, credential, or feature flag
- Standing up a new environment and deciding where values come from
- Reviewing a service that reads `process.env` outside its config module
- A secret appeared somewhere it should not — a log line, a bundle, a default

## Process

### Step 1: Classify the Value

| Kind | Where it lives | Shipped to the client? |
|------|----------------|------------------------|
| Non-sensitive config (URLs, limits, flags) | Config schema, `.env.example` with a real placeholder | Only if `VITE_`-prefixed and public by intent |
| Secret (keys, tokens, passwords) | Runtime secret store, gitignored `.env` locally | Never |
| Per-user authorization | Not config — enforce server-side | Never |

A value that changes behavior per environment is config. A value that grants
access is a secret. If it is both, treat it as a secret.

### Step 2: Add It to the Validated Schema

Declare the variable in the one config module, with a type and — for
non-secrets only — a default. A production secret has no default: a missing
value must abort boot before the process binds a port or starts background
work.

### Step 3: Document Where It Comes From

Update `.env.example` with a safe placeholder and a comment stating *what* the
value is. For anything requiring an external account, add a row to the
committed credentials guide stating *where to obtain it* and *where to set it*.

### Step 4: Keep It Out of Telemetry

Add the field to logger redaction and keep it out of error messages — see
[general-setting-up-observability](../general-setting-up-observability/SKILL.md).

### Step 5: Verify by Breaking It

Boot with the value missing and with it malformed; both must fail fast with a
message naming the variable. Confirm a secret-scanning check runs in CI.

## Anti-Patterns

- **`process.env.X` scattered through the code.** Read the environment in one
  module; everything else imports a typed object.
- **Environment branching in business logic.** `if (env === "production")`
  hides behavior; express the difference as a config value.
- **A working default for a secret.** `dev-secret` booting a production process
  is how a placeholder reaches production.
- **Secrets baked into images or bundles.** Inject at runtime; anything inlined
  into a client bundle is published.
- **Retention of a value nobody can rotate.** Reading from config and
  restarting must be enough to rotate a credential.

## Checklist

- [ ] Value classified as config or secret
- [ ] Declared in the validated startup schema; no default for a production secret
- [ ] `.env.example` updated with a safe placeholder and comment
- [ ] Credentials guide updated when an external account is required
- [ ] Redaction configured; value cannot reach logs or error messages
- [ ] Boot tested with the value missing and malformed
- [ ] Secret scanning active in CI
