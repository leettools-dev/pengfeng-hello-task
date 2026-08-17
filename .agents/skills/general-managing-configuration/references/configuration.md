# Configuration and Secrets

Configuration is everything that varies between environments; secrets are the
subset that must never be exposed. Both enter the process the same way — through
a validated boundary — and never get hard-coded or committed.

## Configuration

- **Load from the environment, validate once at startup, fail fast.** On the
  Fastify stack use [env-schema](https://github.com/fastify/env-schema) with a
  TypeBox/JSON schema; a missing or malformed variable aborts boot with a clear
  message. `[Specification, must-have]`
- **Expose typed config, not `process.env`.** Read environment variables only in
  the one config module; the rest of the app imports a typed object. No
  `process.env.X` scattered through the code. `[Specification, must-have]`
- **No environment branching in logic.** Avoid `if (env === "production")` in
  business code; express the difference as a config value (a flag, a URL, a
  limit) set per environment.
- Provide a committed **`.env.example`** listing every variable with a safe
  placeholder and a comment. It is the contract for what the app needs to run.
- **All credentials live in the repo's gitignored `.env`, prepared before the
  process runs** (locally or via Docker Compose). For any variable that requires
  an external account (OAuth client, email provider, database), ship a committed
  **credentials guide** (e.g. `docs/deployment-credentials.md`) that says, per
  variable, *what it is, where to obtain it, and where to set it* — `.env.example`
  states the *what*, the guide states the *where from*. A preflight/doctor check
  should refuse to run while any required value is missing.

## Secrets

- **Never commit secrets.** `.env` and any real credential file are
  `.gitignore`d. The repository contains only `.env.example` with placeholders.
  `[Specification, must-have]`
- **Inject secrets at runtime** from the platform's secret store (deploy
  environment, vault, cloud secret manager) — not baked into images or build
  artifacts. `[Specification, must-have]`
- **A secret has no working default in shared source or the shared config
  schema.** Every production secret is required, and a missing value aborts
  startup. A known fallback such as `dev-secret` must never make a production
  process boot successfully. `[Specification, must-have]`
- Local development and tests may receive deterministic or generated secrets
  only from an explicitly selected non-production profile, a local `.env`, or
  a test fixture. Keep those values outside the production configuration path,
  and make the profile selection visible in the startup/test command.
- **Secrets never reach logs or telemetry.** Configure logger redaction (see
  [observability.md](../../general-setting-up-observability/references/observability.md)) and keep secret values out of error
  messages.
- **Rotation is a non-event.** Reading a secret from config (not a constant) and
  restarting must be enough to rotate it. Document rotation owners for
  externally-issued credentials.
- For browser, VS Code, and mobile clients: only **public, non-sensitive**
  config may be shipped to the client. Anything secret stays server-side; the
  client obtains capability through the authenticated API, never an embedded key.

## Frontend Config

- Vite exposes only `VITE_`-prefixed variables to client code, and they are
  **public by definition** — treat anything inlined into the bundle as published.
- API base URLs and feature flags are configuration; per-user authorization is
  not — enforce access on the server (see
  [authorization.md](../../security-designing-authorization/references/authorization.md)).

## Verification

- The startup schema is the test: boot with a deliberately bad/missing variable
  in CI and assert a clear failure.
- Run the production-profile boot test with each required secret omitted in
  turn; it must fail before binding a port or starting background work.
- Assert that explicit local/test overrides work without weakening the
  production schema.
- A secret-scanning check (e.g. gitleaks) in CI prevents accidental commits.

## Primary References

- [The Twelve-Factor App — Config](https://12factor.net/config)
- [@fastify/env-schema](https://github.com/fastify/env-schema)
- [Vite — Env Variables and Modes](https://vite.dev/guide/env-and-mode)
