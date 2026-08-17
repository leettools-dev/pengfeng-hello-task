---
name: system-managing-domains-and-tls
description: "Set up and operate custom domains, DNS records, and TLS certificates — issuance, automated renewal, HTTPS enforcement, and renewal monitoring; provider automation via the toolchain's utility repo (e.g. leet-ssl-cert)."
layer: lifecycle
applies_when:
  deploy_target: [gcp, fly]
---

<!-- Installed by leet-dev-guides skill-instantiate from leet-dev-guides. Do not edit directly; change the overlay in .agents/skill-overlays/ and re-run `npm run skills:install`. -->

# Managing Domains and TLS

## Overview

A product isn't launched until it answers on its own domain over HTTPS — and
it isn't operated until certificate renewal is automated *and monitored*.
Expired certificates are the classic solo-founder outage: silent for 60–90
days, then total. This skill defines the domain/TLS lifecycle; registrar- and
provider-specific commands live in a sibling utility repo (typically
`leet-ssl-cert`) declared in `.agents/toolchain.json`.

Use this skill when:
- Pointing a custom domain at staging or production
- Setting up or debugging TLS issuance and renewal
- Auditing an environment before launch

## Prerequisites

Requires the certificate/DNS utility repo pinned in
`.agents/toolchain-lock.json` (e.g. `leet-ssl-cert`) with a `doctor` command,
plus registrar/DNS API credentials as that repo documents. DNS and
certificate state is remote, shared, and slow to heal — preflight (`doctor`)
before every mutation; on failure, stop and report the exact missing
credential or permission. Never hand-edit DNS at a registrar console while an
automation tool also manages it.

## Domain and DNS Setup

- Record the domain plan in `deploy/production/README.md` (and staging's):
  apex vs `www`, `app.` / `api.` subdomains, and staging names
  (`staging.<domain>` — never a lookalike domain).
- DNS records are managed by the utility tool and mirrored as a table in the
  deploy README: type, name, target, TTL, purpose. Anything not in the table
  is a candidate for deletion, not folklore.
- Before cutover, verify with `dig` that new records resolve from a public
  resolver; respect TTLs when planning the switch (lower TTL a day before a
  planned move).

## TLS Lifecycle

| Stage | Rule |
|-------|------|
| Issuance | ACME (Let's Encrypt or equivalent) via the utility tool or the platform's managed certs — never manual CSR ceremonies |
| Coverage | Every name users or clients hit, including `api.` and staging; prefer per-name or wildcard as the utility tool documents |
| Renewal | Automated, unattended, at least 30 days before expiry |
| Renewal proof | After setup, force one renewal (or dry-run) and confirm the serving cert actually rotated — issuance working ≠ renewal working |
| Monitoring | An expiry alert in `ops/alerts/` (ticket severity, ≤ 21 days to expiry) that does not depend on the renewal mechanism it watches |

## HTTPS Enforcement

- Redirect HTTP → HTTPS at the edge; app never serves plaintext responses.
- Set HSTS (`max-age` ≥ 6 months) only after redirects have been stable —
  HSTS makes TLS mistakes sticky. Add `includeSubDomains`/preload only
  deliberately.
- Cookies `Secure`; internal service-to-service traffic follows the same
  no-plaintext rule unless the platform provides the encryption.

## Anti-Patterns

- **Unmonitored auto-renewal.** "certbot is on a timer" with no independent expiry alert — the timer's failure mode is silence.
- **Split-brain DNS.** Records managed both by tool and by console clicks; the next `apply` deletes the manual ones.
- **Lookalike staging domains.** `myproduct-staging.com` teaches users to trust phishing patterns; use a subdomain.
- **Day-one HSTS preload.** Locking browsers to HTTPS before the setup has survived a week.
- **Undocumented records.** MX or verification TXT records that only exist in the registrar console.

## Checklist

- [ ] Utility repo pinned; `doctor` preflight passes before DNS/cert mutations
- [ ] DNS records tabled in the deploy README, tool-managed
- [ ] Certs cover every public name, staging included
- [ ] One renewal forced and verified end-to-end
- [ ] Independent expiry alert in `ops/alerts/`
- [ ] HTTP→HTTPS redirect everywhere; HSTS after stability
