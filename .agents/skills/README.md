# Installed Skills

Installed by `leet-dev-guides skill-instantiate`. **This directory is
regenerated in full on every run — do not edit anything in it.** To change an
installed skill, edit the product overlay in `.agents/skill-overlays/` or the
repo that owns the skill, then re-run:

```bash
npm run skills:install
```

These files are committed. A product repo carries its own skills so its
lifecycle runs with no sibling repo checked out beside it; the binaries those
skills drive stay external and are invoked through `npx`.

Which skills land here is decided by the `profile` in
`.agents/skill-instantiation.json`, matched against each skill's
`applies_when`. Sources are listed in `.agents/toolchain.json`, and the
resolved commit of each is pinned in `.agents/toolchain-lock.json`.

## Harness views

Each of these is a symlink to this directory:

- `.claude/skills`

## Contents

### From `leet-dev-guides` (45)

- backend-typescript-building-fastify-services
- code-respond-to-feedbacks
- cut-release
- dev-cycle-managing-roadmaps
- dev-cycle-planning-implementation
- dev-cycle-synthesizing-research
- dev-cycle-writing-dev-specs
- frontend-typescript-building-react-frontends
- general-delivering-changes-with-git
- general-designing-apis
- general-diagramming-architecture
- general-frontend-audit
- general-frontend-design
- general-frontend-hardening
- general-frontend-responsive-design
- general-frontend-ux-copy
- general-frontend-verify
- general-handling-errors
- general-instrumenting-product-analytics
- general-managing-configuration
- general-managing-design-tokens
- general-migrating-data-schemas
- general-operating-safely
- general-performance-optimization
- general-reviewing-design-with-aposd
- general-setting-up-observability
- general-testing-strategies
- general-writing-commit-messages
- gtm-generating-launch-artifacts
- gtm-writing-release-communications
- gtm-writing-sales-collateral
- gtm-writing-user-documentation
- leet-development-foreman
- ops-defining-alerts-and-slos
- ops-responding-to-incidents
- pr
- security-designing-authentication
- security-designing-authorization
- system-deploying-environments
- system-developing-with-docker
- system-integrating-git-hosting
- system-managing-domains-and-tls
- testing-typescript-applications
- testing-with-playwright
- typescript-implementing-logging
