# Agent Tools

Keep this directory for thin product-local wrappers, checkers, and manifests.
Reusable or provider-specific automation should live in sibling utility repos
declared in `.agents/toolchain.json`.

Expected sibling utility repos:

- `../leet-deploy` for deployment preflight, plan, apply, and rollback.
- `../leet-ssl-cert` for certificate issuance, renewal, and load-balancer
  binding.

Each publishes the skills it owns from its own `skills/` directory, which are
installed into `.agents/skills/` here. The binaries themselves stay external
and are invoked through `npx`.

## Generated Checkers

Three self-contained scripts ship with the scaffold. All three run under plain
`node` (Node 24 strips their type annotations natively) — never `tsx`.

```bash
npm run check:scaffold       # required layout paths exist
npm run check:checklist      # the instantiated plan and checklists are well-formed
npm run check:capabilities   # read-only probe of every external capability a
                             # later lifecycle step depends on
```

`check:capabilities` writes `.agents/capabilities.json` from
`.agents/environments.json` and `.agents/budgets.json`. It creates nothing,
records credential variables by name only, and is safe to commit — later steps
and `check:checklist` resolve capability claims against it rather than against
an agent's assertion. Re-run it whenever the environment set or the injected
credentials change.

Pin current utility commits with:

```bash
npm run toolchain:lock
```
