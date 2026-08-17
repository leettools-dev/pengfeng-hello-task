# Checklist — Step 12: Tell people

Gate (from lifecycle): User-facing docs match shipped behavior; release,
marketing, and sales artifacts are required only when their PRD-scoped
applicability holds.

## gtm.docs-match-shipped — User docs describe what actually shipped  [must]

- Invariant: The user-facing documentation reflects the behavior that shipped —
  no steps for features that were cut, no missing steps for features that landed.
- Evidence required: `gtm/documentation/` walked against the running product.
- Counterexample: The how-to tells users to click a button that was removed.
- Applies when: The product has end users.
- Applicability: PRD §Users: "Visitor (anonymous). Opens the URL, sees the
  greeting. Nothing else." — one end-user type exists.
- Status: PENDING
- Note: `gtm/documentation/README.md` is currently a generic placeholder; it
  needs a short entry describing that visiting the URL shows "Hello,
  Venture!" and nothing else.

## gtm.release-notes — Release notes exist and are accurate  [must]

- Invariant: Release notes describe the user-visible changes truthfully and are
  published where users will see them.
- Evidence required: `gtm/marketing/` release notes matching the merged diff.
- Counterexample: Release notes promise a feature that is not live.
- Applies when: The PRD names a release/launch audience or publication channel;
  otherwise N/A with the PRD's scope/non-goals citation.
- Applicability: `docs/prd/hello-task.md` names no release, launch, or
  publication audience anywhere — §Users names only the anonymous visitor;
  the PRD's stated purpose is to "exercise the Foreman delivery path," not to
  announce a feature to any audience.
- Status: N/A — PRD names no release/launch audience or publication channel
  (§Users, §Problem).

## gtm.claims-truthful — Marketing claims match reality  [must]

- Invariant: Every capability or metric claimed in launch material is true of the
  shipped product.
- Evidence required: Each claim traceable to shipped behavior.
- Counterexample: A launch post claims "real-time" when results only refresh on
  reload.
- Applies when: Launch/marketing material is produced.
- Applicability: `gtm.release-notes` above resolves `N/A` — no launch/
  marketing material is produced for this PRD.
- Status: N/A — No launch/marketing material is produced (see
  `gtm.release-notes`).

## gtm.sales-collateral — Sales/FAQ material is present when needed  [should]

- Invariant: The sales or early-user collateral the PRD calls for exists and is
  consistent with the docs and release notes.
- Evidence required: `gtm/sales/` artifacts consistent with the other GTM
  material.
- Counterexample: The FAQ contradicts the pricing in the release notes.
- Applies when: The PRD calls for sales/FAQ collateral; otherwise N/A with the
  citation.
- Applicability: `docs/prd/hello-task.md` names no sales, pricing, or FAQ
  audience.
- Status: N/A — PRD names no sales/FAQ audience.
